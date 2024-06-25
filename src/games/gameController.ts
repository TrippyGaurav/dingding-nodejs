import { NextFunction, Request, Response } from "express";
import Game from "./gameModel";
import Player from "../player/playerModel";
import createHttpError from "http-errors";

export const getAllGames = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.query;
    const { creatorRole, creatorUsername } = req.body;

    // Base match stage
    let matchStage = {};
    if (category) {
      matchStage = { category };
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
          $group: {
            _id: null,
            allGames: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            featured: { $slice: ["$allGames", 5] }, // Top 5 latest games
            others: { $slice: ["$allGames", 5, { $size: "$allGames" }] }, // All other games
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

export const updateGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gameId } = req.params;
    const { creatorRole, ...updateFields } = req.body;

    if (!gameId) {
      throw createHttpError(400, "Game ID is required");
    }

    if (creatorRole !== "company") {
      throw createHttpError(
        401,
        "Access denied: You don't have permission to update games"
      );
    }

    // Ensure only existing fields in the document are updated
    const game = await Game.findById(gameId);
    if (!game) {
      throw createHttpError(404, "Game not found");
    }

    // Filter out fields that do not exist in the original document
    const fieldsToUpdate = Object.keys(updateFields).reduce((acc, key) => {
      if (game[key] !== undefined) {
        acc[key] = updateFields[key];
      }
      return acc;
    }, {});

    const updatedGame = await Game.findByIdAndUpdate(
      gameId,
      { $set: fieldsToUpdate },
      { new: true }
    );

    res.status(200).json(updatedGame);
  } catch (error) {
    next(error);
  }
};

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
