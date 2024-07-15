import { NextFunction, Request, Response } from "express";
import { NewPlatform, Payouts, Platform } from "./gameModel";
import Game from "./gameModel";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { AuthRequest, uploadImage } from "../../utils/utils";
import { Player } from "../users/userModel";
import cloudinary from 'cloudinary';
import { config } from "../../config/config";


cloudinary.v2.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret,
});

interface GameRequest extends Request {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}

interface CloudinaryUploadResult {
  secure_url: string;
}



export class GameController {

  constructor() {
    this.getGames = this.getGames.bind(this);
    this.addGame = this.addGame.bind(this);
    this.addPlatform = this.addPlatform.bind(this);
    this.getPlatforms = this.getPlatforms.bind(this);
    this.updateGame = this.updateGame.bind(this);
  }

  // GET : Games
  async getGames(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { category, platform } = req.query;
      const { username, role } = _req.user;


      if (!platform) {
        throw createHttpError(400, "Platform query parameter is required")
      }

      let matchStage: any = {};
      if (category && category !== "all" && category !== "fav") {
        matchStage.category = category;
      }


      if (role === "player") {
        if (category === "fav") {
          const player = await Player.findOne({ username }).populate("favouriteGames");
          if (!player) {
            throw createHttpError(404, "Player not found")
          }

          const favouriteGames = await Game.find({ _id: { $in: player.favouriteGames } }).select('-url');

          return res.status(200).json({ featured: [], others: favouriteGames });
        }
        else {
          const platformDoc = await Platform.findOne({ name: platform }).populate("games");
          if (!platformDoc) {
            throw createHttpError(404, `Platform ${platform} not found`);
          }

          const platformGames = platformDoc.games;

          const games = await Game.aggregate([
            { $match: { _id: { $in: platformGames.map(game => game._id) }, ...matchStage } },
            {
              $sort: { createdAt: -1 }
            },
            {
              $facet: {
                featured: [{ $limit: 5 }, { $project: { url: 0 } }],
                others: [{ $skip: 5 }, { $project: { url: 0 } }]
              }
            }
          ]);
          return res.status(200).json(games[0])
        }
      }
      else if (role === "company") {
        if (category === "all") {
          const platforms = await Platform.find().populate("games");
          let allGames: mongoose.Types.ObjectId[] = [];

          platforms.forEach(platform => {
            allGames = allGames.concat(platform.games.map(game => game._id));
          });

          const games = await Game.aggregate([
            { $match: { _id: { $in: allGames }, ...matchStage } },
            { $sort: { createdAt: -1 } },
            { $project: { url: 0 } }
          ]);
          return res.status(200).json(games);

        }
        else {
          const platformDoc = await Platform.findOne({ name: category }).populate("games");

          if (platformDoc) {
            const platformGames = platformDoc.games;

            const games = await Game.aggregate([
              { $match: { _id: { $in: platformGames.map(game => game._id) } } },
              { $sort: { createdAt: -1 } },
              { $project: { url: 0 } }
            ])

            return res.status(200).json(games);
          }
          else {
            throw createHttpError(401, "Platform category not found")
          }
        }

      }
      else {
        return next(createHttpError(403, "Access denied: You don't have permission to access this resource."));
      }
    } catch (error) {
      next(error);
    }
  }

  // POST : Add Game
  async addGame(req: GameRequest, res: Response, next: NextFunction) {
    const session = await mongoose.startSession();
    session.startTransaction();

    let thumbnailUploadResult: cloudinary.UploadApiResponse | undefined;

    try {
      const _req = req as AuthRequest;
      const { role } = _req.user;

      if (role != "company") {
        throw createHttpError(401, "Access denied: You don't have permission to add games")
      }

      const { name, url, type, category, status, tagName, slug, platformName } = req.body;

      if (!name || !url || !type || !category || !status || !tagName || !slug || !req.files.thumbnail || !req.files.payoutFile || !platformName) {
        throw createHttpError(400, "All required fields must be provided, including the payout file and platform");
      }

      const platform = await NewPlatform.findOne({ name: platformName });
      if (!platform) {
        throw createHttpError(404, "Platform not found")
      }

      const existingGame = await NewPlatform.aggregate([
        { $match: { _id: platform._id } },
        { $unwind: '$games' }, // Deconstruct the games array
        { $match: { $or: [{ 'games.name': name }, { 'games.slug': slug }] } },
        { $limit: 1 } // Limit the result to 1 document for performance
      ])

      if (existingGame.length > 0) {
        throw createHttpError(400, "Game already exists in the platform")
      }

      // Upload thumbnail to Cloudinary
      const thumbnailBuffer = req.files.thumbnail[0].buffer;
      try {
        thumbnailUploadResult = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
          cloudinary.v2.uploader.upload_stream({ resource_type: 'image', folder: platformName }, (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result as cloudinary.UploadApiResponse);
          }).end(thumbnailBuffer);
        });
      } catch (uploadError) {
        throw createHttpError(500, "Failed to upload thumbnail");
      }

      // Handle file for payout
      const jsonData = JSON.parse(req.files.payoutFile[0].buffer.toString('utf-8'));
      const newPayout = new Payouts({
        gameName: tagName,
        data: jsonData,
      });


      await newPayout.save({ session });

      const newGame = {
        name,
        thumbnail: thumbnailUploadResult.secure_url,
        url,
        type,
        category,
        status,
        tagName,
        slug,
        payout: newPayout._id,
      };


      platform.games.push(newGame as any);
      await platform.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).json(platform);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      // If thumbnail was uploaded but an error occurred afterward, delete the thumbnail
      if (thumbnailUploadResult && thumbnailUploadResult.public_id) {
        cloudinary.v2.uploader.destroy(thumbnailUploadResult.public_id, (destroyError, result) => {
          if (destroyError) {
            console.log("Failed to delete thumbnail from Cloudinary:", destroyError);
          } else {
            console.log("Thumbnail deleted from Cloudinary:", result);
          }
        });
      }

      next(error);
    }
  }

  // POST : Add Platform
  async addPlatform(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { role } = _req.user;

      if (role != "company") {
        throw createHttpError(401, "Access denied: You don't have permission to add games");
      }

      const { name } = req.body;


      if (!name) {
        throw createHttpError(400, "Platform name is required");
      }

      const existingPlatform = await NewPlatform.findOne({ name });
      if (existingPlatform) {
        throw createHttpError(400, "Platform with the same name already exists")
      }
      const newPlatform = new NewPlatform({ name, games: [] });
      const savedPlatform = await newPlatform.save();

      res.status(201).json(savedPlatform);
    } catch (error) {
      console.error("Error adding platform:", error);
      next(error);
    }
  }

  // GET : Get all Platform
  async getPlatforms(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { role } = _req.user;

      if (role != "company") {
        throw createHttpError(401, "Access denied: You don't have permission to add games");
      }

      const platforms = await NewPlatform.find();
      res.status(200).json(platforms)
    } catch (error) {
      console.error("Error fetching platforms:", error);
      next(error);
    }
  }

  // PUT : Update a Game
  async updateGame(req: GameRequest, res: Response, next: NextFunction) {
    const session = await mongoose.startSession();
    session.startTransaction();

    let thumbnailUploadResult: cloudinary.UploadApiResponse | undefined;

    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;
      const { gameId } = req.params;
      const { status, slug, platformName, ...updateFields } = req.body;

      if (!gameId) {
        throw createHttpError(400, "Game ID is required");
      }

      if (!mongoose.Types.ObjectId.isValid(gameId)) {
        throw createHttpError(400, "Invalid Game ID format");
      }

      if (role !== "company") {
        throw createHttpError(401, "Access denied: You don't have permission to update games");
      }

      const existingGame = await NewPlatform.aggregate([
        { $match: { name: platformName } },
        { $unwind: '$games' },
        { $match: { 'games._id': new mongoose.Types.ObjectId(gameId) } },
        { $limit: 1 }
      ]);

      if (!existingGame || existingGame.length === 0) {
        throw createHttpError(404, "Game not found");
      }

      const game = existingGame[0].games;

      // Validate the status field
      if (status && !["active", "inactive"].includes(status)) {
        throw createHttpError(400, "Invalid status value. It should be either 'active' or 'inactive'");
      }

      // Ensure slug is unique if it is being updated
      if (slug && slug !== game.slug) {
        const existingGameWithSlug = await Game.findOne({ slug });
        if (existingGameWithSlug) {
          throw createHttpError(400, "Slug must be unique");
        }
      }

      // Ensure only existing fields in the document are updated
      const fieldsToUpdate = Object.keys(updateFields).reduce((acc: any, key) => {
        if (game[key] !== undefined) {
          acc[key] = updateFields[key];
        }
        return acc;
      }, {} as { [key: string]: any });

      // Include status and slug fields if they are valid
      if (status) {
        fieldsToUpdate.status = status;
      }
      if (slug) {
        fieldsToUpdate.slug = slug;
      }

      // Handle file for payout update
      if (req.files?.payoutFile) {
        // Delete the old payout
        if (game.payout) {
          await Payouts.findByIdAndDelete(game.payout);
        }

        // Add the new payout
        const jsonData = JSON.parse(req.files.payoutFile[0].buffer.toString("utf-8"));
        const newPayout = new Payouts({
          gameName: game.name,
          data: jsonData,
        });

        await newPayout.save({ session });
        fieldsToUpdate.payout = newPayout._id;
      }

      // Handle file for thumbnail update
      if (req.files?.thumbnail) {
        const thumbnailBuffer = req.files.thumbnail[0].buffer;

        thumbnailUploadResult = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
          cloudinary.v2.uploader.upload_stream({ resource_type: 'image', folder: platformName }, (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result as cloudinary.UploadApiResponse);
          }).end(thumbnailBuffer);
        });

        fieldsToUpdate.thumbnail = thumbnailUploadResult.secure_url; // Save the Cloudinary URL
      }

      // If no valid fields to update, return an error
      if (Object.keys(fieldsToUpdate).length === 0) {
        throw createHttpError(400, "No valid fields to update");
      }

      const updatedPlatform = await NewPlatform.findOneAndUpdate(
        { name: platformName, 'games._id': new mongoose.Types.ObjectId(gameId) },
        {
          $set: {
            'games.$': { ...game, ...fieldsToUpdate }
          }
        },
        { new: true, session }
      );

      if (!updatedPlatform) {
        throw createHttpError(404, "Platform not found");
      }

      await session.commitTransaction();
      res.status(200).json(updatedPlatform);
    } catch (error) {
      await session.abortTransaction();

      if (thumbnailUploadResult && thumbnailUploadResult.public_id) {
        cloudinary.v2.uploader.destroy(thumbnailUploadResult.public_id, (destroyError, result) => {
          if (destroyError) {
            console.log("Failed to delete thumbnail from Cloudinary:", destroyError);
          } else {
            console.log("Thumbnail deleted from Cloudinary:", result);
          }
        });
      }

      if (error instanceof mongoose.Error.CastError) {
        next(createHttpError(400, "Invalid Game ID"));
      } else {
        next(error);
      }
    } finally {
      session.endSession();
    }

  }
}


// DONE
export const updateGame = async (
  req: GameRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gameId } = req.params;
    const { creatorRole, status, slug, ...updateFields } = req.body;

    if (!gameId) {
      throw createHttpError(400, "Game ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      throw createHttpError(400, "Invalid Game ID format");
    }

    if (creatorRole !== "company") {
      throw createHttpError(
        401,
        "Access denied: You don't have permission to update games"
      );
    }

    // Check if the game exists
    const game = await Game.findById(gameId);
    if (!game) {
      throw createHttpError(404, "Game not found");
    }

    // Validate the status field
    if (status && !["active", "inactive"].includes(status)) {
      throw createHttpError(
        400,
        "Invalid status value. It should be either 'active' or 'inactive'"
      );
    }

    // Ensure slug is unique if it is being updated
    if (slug && slug !== game.slug) {
      const existingGameWithSlug = await Game.findOne({ slug });
      if (existingGameWithSlug) {
        throw createHttpError(400, "Slug must be unique");
      }
    }

    // Ensure only existing fields in the document are updated
    const fieldsToUpdate = Object.keys(updateFields).reduce((acc: any, key) => {
      if (game[key] !== undefined) {
        acc[key] = updateFields[key];
      }
      return acc;
    }, {} as { [key: string]: any });

    // Include status and slug fields if they are valid
    if (status) {
      fieldsToUpdate.status = status;
    }
    if (slug) {
      fieldsToUpdate.slug = slug;
    }

    // Find the platform this game belongs to
    const platform = await Platform.findOne({ games: gameId });
    if (!platform) {
      throw createHttpError(400, `Platform not found for game with ID: ${gameId}`);
    }

    // Handle file for payout update
    if (req.files?.payoutFile) {
      // Delete the old payout
      if (game.payout) {
        await Payouts.findByIdAndDelete(game.payout);
      }

      // Add the new payout
      const jsonData = JSON.parse(req.files.payoutFile[0].buffer.toString("utf-8"));
      const newPayout = new Payouts({
        gameName: game.name,
        data: jsonData,
      });

      await newPayout.save();
      fieldsToUpdate.payout = newPayout._id;
    }

    // Handle file for thumbnail update
    // Handle file for thumbnail update
    if (req.files?.thumbnail) {
      const thumbnailBuffer = req.files.thumbnail[0].buffer;

      const thumbnailUploadResult = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({ resource_type: 'image', folder: platform.name }, (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result as cloudinary.UploadApiResponse);
        }).end(thumbnailBuffer);
      });

      fieldsToUpdate.thumbnail = thumbnailUploadResult.secure_url; // Save the Cloudinary URL
    }


    // If no valid fields to update, return an error
    if (Object.keys(fieldsToUpdate).length === 0) {
      throw createHttpError(400, "No valid fields to update");
    }

    const updatedGame = await Game.findByIdAndUpdate(
      gameId,
      { $set: fieldsToUpdate },
      { new: true }
    );

    res.status(200).json(updatedGame);
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      next(createHttpError(400, "Invalid Game ID"));
    } else {
      next(error);
    }
  }
};

// DONE
export const deleteGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gameId } = req.params;
    const { creatorRole } = req.body;

    if (!gameId) {
      throw createHttpError(400, "Game ID is required");
    }

    if (creatorRole !== "company") {
      throw createHttpError(
        401,
        "Access denied: You don't have permission to delete games"
      );
    }

    const deletedGame = await Game.findByIdAndDelete(gameId);

    if (!deletedGame) {
      throw createHttpError(404, "Game not found");
    }

    res.status(200).json({ message: "Game deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// DONE
export const getGameById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      throw createHttpError(400, "Game ID is required");
    }

    const game = await Game.findOne({ slug: gameId });

    if (!game) {
      throw createHttpError(404, "Game not found");
    }

    if (game.status === "active") {
      res.status(200).json({ url: game.url });
    } else {
      res
        .status(200)
        .json({ message: "This game is currently under maintenance" });
    }
  } catch (error) {
    next(error);
  }
};

export const uploadThubnail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.image) {
    return res.status(400).json({ error: "Please upload the image" });
  }
  try {
    const image = req.body.image;
    const imageUrl = await uploadImage(image);
    res.json({
      message: "File uploaded successfully",
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload file" });
  }
};

export const addFavouriteGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { playerId } = req.params;
    const { gameId, type } = req.body;

    if (!playerId || !gameId) {
      throw createHttpError(400, "Player ID and Game ID are required");
    }

    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      throw createHttpError(400, "Invalid Player ID format");
    }

    if (type !== "add" && type !== "remove") {
      throw createHttpError(400, "Invalid type value. It should be either 'add' or 'remove'");
    }

    const player = await Player.findById(playerId);

    if (!player) {
      throw createHttpError(404, "Player not found");
    }

    let message;
    let updatedPlayer;

    if (type === "add") {
      updatedPlayer = await Player.findByIdAndUpdate(
        playerId,
        { $addToSet: { favouriteGames: gameId } },
        { new: true }
      );

      message = updatedPlayer.favouriteGames.includes(gameId)
        ? "Game added to favourites"
        : "Game already in favourites";

    } else if (type === "remove") {
      updatedPlayer = await Player.findByIdAndUpdate(
        playerId,
        { $pull: { favouriteGames: gameId } },
        { new: true }
      );

      message = !updatedPlayer.favouriteGames.includes(gameId)
        ? "Game removed from favourites"
        : "Game not found in favourites";
    }

    return res.status(200).json({ message, data: updatedPlayer });

  } catch (error) {
    next(error);
  }
};
