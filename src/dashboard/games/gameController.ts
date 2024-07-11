import { NextFunction, Request, Response } from "express";
import { Payouts, Platform } from "./gameModel";
import Game from "./gameModel";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { AuthRequest, uploadImage } from "../../utils/utils";
import { Player } from "../users/userModel";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../../config/config";


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

          const favouriteGames = await Game.find({ _id: { $in: player.favouriteGames } });
          console.log("FAv : ", favouriteGames);

          return res.status(200).json({ featured: [], others: favouriteGames });
        }
        else {
          const platformDoc = await Platform.findOne({ name: platform }).populate("games");
          if (!platformDoc) {
            throw createHttpError(404, `Platform ${platform} not found`);
          }

          const platformGames = platformDoc.games;

          console.log("Platform Games : ", platformGames);



          const games = await Game.aggregate([
            { $match: { _id: { $in: platformGames.map(game => game._id) }, ...matchStage } },
            {
              $sort: { createdAt: -1 }
            },
            {
              $facet: {
                featured: [{ $limit: 5 }],
                others: [{ $skip: 5 }]
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
            { $sort: { createdAt: -1 } }
          ]);
          return res.status(200).json(games);

        }
        else {
          const platformDoc = await Platform.findOne({ name: category }).populate("games");

          if (platformDoc) {
            const platformGames = platformDoc.games;

            const games = await Game.aggregate([
              { $match: { _id: { $in: platformGames.map(game => game._id) } } },
              { $sort: { createdAt: -1 } }
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

    try {
      const _req = req as AuthRequest;
      const { role } = _req.user;

      if (role != "company") {
        throw createHttpError(401, "Access denied: You don't have permission to add games")
      }

      const { name, thumbnail, url, type, category, status, tagName, slug, platform } = req.body;


      if (!name || !url || !type || !category || !status || !tagName || !slug || !req.files.thumbnail || !req.files.payoutFile || !platform) {
        throw createHttpError(400, "All required fields must be provided, including the payout file and platform");
      }


      const existingGame = await Game.findOne({ $or: [{ name }, { slug }] }).session(session);
      if (existingGame) {
        throw createHttpError(
          409,
          "Game with the same name or slug already exists"
        );
      }

      // Find the platform
      const platformDoc = await Platform.findOne({ name: platform }).session(session);
      if (!platformDoc) {
        throw createHttpError(400, `Platform ${platform} not found`);
      }

      cloudinary.config({
        cloud_name: config.cloud_name,
        api_key: config.api_key,
        api_secret: config.api_secret,
      });

      // Upload thumbnail to Cloudinary
      const thumbnailBuffer = req.files.thumbnail[0].buffer;
      const thumbnailUploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'image', folder: platform }, (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result as CloudinaryUploadResult);
        }).end(thumbnailBuffer);
      });


      // Handle file for payout
      const jsonData = JSON.parse(req.files.payoutFile[0].buffer.toString('utf-8'));
      const newPayout = new Payouts({
        gameName: tagName,
        data: jsonData,
      });

      await newPayout.save({ session });

      const game = new Game({
        name,
        thumbnail: thumbnailUploadResult.secure_url, // Save the Cloudinary URL
        url,
        type,
        category,
        status,
        tagName,
        slug,
        payout: newPayout._id,
      });

      const savedGame = await game.save({ session });
      platformDoc.games.push(savedGame._id as mongoose.Types.ObjectId)
      await platformDoc.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).json(savedGame);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.log(error);

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
      console.log(req.body);


      console.log("Platform Name ", name);


      if (!name) {
        throw createHttpError(400, "Platform name is required");
      }

      const existingPlatform = await Platform.findOne({ name });
      if (existingPlatform) {
        throw createHttpError(400, "Platform with the same name already exists")
      }
      const newPlatform = new Platform({ name, games: [] });
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

      const platforms = await Platform.find();
      res.status(200).json(platforms)
    } catch (error) {
      console.error("Error fetching platforms:", error);
      next(error);
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

      const thumbnailUploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: platform.name // Specify the folder name based on the platform name
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result as CloudinaryUploadResult);
          }
        ).end(thumbnailBuffer);
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
    console.log("Game : ", game);


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
