import { NextFunction, Request, Response } from "express";
import Game, { Payouts } from "./gameModel";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { uploadImage } from "../utils/utils";
import { Player } from "../users/userModel";

interface GameRequest extends Request {
  file: Express.Multer.File;
}

// DONE
export const getAllGames = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.query;
    const { creatorRole, creatorUsername } = req.body;

    // Base match stage
    let matchStage: any = {};
    if (category) {
      matchStage.category = category;
    }

    // Determine the type of response based on the user's role
    if (creatorRole === "company") {
      // Company: send all games in a single array
      const games = await Game.aggregate([{ $match: matchStage }]);
      return res.status(200).json(games);
    } else if (creatorRole === "player") {
      // Player: send games split into featured and others
      const games = await Game.aggregate([
        { $match: matchStage },
        {
          $sort: { createdAt: -1 },
        },
        {
          $facet: {
            featured: [{ $limit: 5 }],
            others: [{ $skip: 5 }],
          },
        },
      ]);

      return res.status(200).json(games[0] || { featured: [], others: [] });
    } else {
      return res.status(400).json({ error: "Invalid creatorRole" });
    }
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DONE
export const addGame = async (
  req: GameRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      thumbnail,
      url,
      type,
      category,
      status,
      tagName,
      slug,
      creatorUsername,
      creatorRole,
    } = req.body;

    if (
      !name ||
      !thumbnail ||
      !url ||
      !type ||
      !category ||
      !status ||
      !tagName ||
      !slug ||
      !req.file
    ) {
      throw createHttpError(
        400,
        "All required fields must be provided, including the payout file"
      );
    }

    if (req.file) {
      console.log("Receiced payout file");
    }

    if (creatorRole !== "company") {
      throw createHttpError(
        401,
        "Access denied: You don't have permission to add games"
      );
    }

    const existingGame = await Game.findOne({ $or: [{ name }, { slug }] });
    if (existingGame) {
      throw createHttpError(
        409,
        "Game with the same name or slug already exists"
      );
    }

    // Handle file for payout
    const jsonData = JSON.parse(req.file.buffer.toString("utf-8"));
    const newPayout = new Payouts({
      gameName: tagName,
      data: jsonData,
    });

    await newPayout.save();

    console.log("JSON Data : ", jsonData);

    const game = new Game({
      name,
      thumbnail,
      url,
      type,
      category,
      status,
      tagName,
      slug,
      payout: newPayout._id,
    });

    const savedGame = await game.save();
    res.status(201).json(savedGame);
  } catch (error) {
    next(error);
  }
};

// DONE
export const updateGame = async (
  req: Request,
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

    // Handle file for payout update
    if (req.file) {
      // Delete the old payout
      if (game.payout) {
        await Payouts.findByIdAndDelete(game.payout);
      }

      // Add the new payout
      const jsonData = JSON.parse(req.file.buffer.toString("utf-8"));
      const newPayout = new Payouts({
        gameName: game.name,
        data: jsonData,
      });

      await newPayout.save();
      fieldsToUpdate.payout = newPayout._id;
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

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      throw createHttpError(400, "Invalid Game ID format");
    }

    const game = await Game.findById(gameId);

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

    if (!req.isPlayer) {
      throw createHttpError(
        403,
        "Access denied: You don't have permission to perform this action"
      );
    }

    if (!playerId || !gameId) {
      throw createHttpError(400, "Player ID and Game ID are required");
    }

    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      throw createHttpError(400, "Invalid Player ID format");
    }

    if (type !== "add" && type !== "remove") {
      throw createHttpError(
        400,
        "Invalid type value. It should be either 'add' or 'remove'"
      );
    }

    const player = await Player.findById(playerId);

    if (!player) {
      throw createHttpError(404, "Player not found");
    }

    if (type === "add") {
      if (!player.favouriteGames.includes(gameId)) {
        player.favouriteGames.push(gameId);
      }
    } else if (type === "remove") {
      player.favouriteGames = player.favouriteGames.filter(
        (id) => id !== gameId
      );
    }

    await player.save();

    res.status(200).json(player);
  } catch (error) {
    next(error);
  }
};
