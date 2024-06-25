import { NextFunction, Request, Response } from "express";
import Game from "./gameModel";
import createHttpError from "http-errors";
import mongoose from "mongoose";

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
  req: Request,
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
      !slug
    ) {
      throw createHttpError(400, "All required fields must be provided");
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

    const game = new Game({
      name,
      thumbnail,
      url,
      type,
      category,
      status,
      tagName,
      slug,
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
