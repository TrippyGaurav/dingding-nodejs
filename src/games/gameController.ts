import { NextFunction, Request, Response } from "express";
import Game from "./gameModel";
import Player from "../player/playerModel";
import createHttpError from "http-errors";

export const getAllGames = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { category } = req.query;
  const { username, creatorDesignation } = req.body;
  try {
    let query: any = {};
    if (creatorDesignation === "player") {
      query.status = true;
    }
    if (category && category !== "all") {
      if (category === "fav") {
        if (!username) {
          return res
            .status(400)
            .json({ error: "Username is required for fav category" });
        }
        const user = await Player.findOne({ username: username });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        query._id = { $in: user.favouriteGames };
      } else {
        query.category = category;
      }
    }

    const games = await Game.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: null,
          featured: {
            $push: { $cond: [{ $eq: ["$type", "featured"] }, "$$ROOT", null] },
          },
          otherGames: {
            $push: { $cond: [{ $ne: ["$type", "featured"] }, "$$ROOT", null] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          featured: {
            $filter: {
              input: "$featured",
              as: "game",
              cond: { $ne: ["$$game", null] },
            },
          },
          otherGames: {
            $filter: {
              input: "$otherGames",
              as: "game",
              cond: { $ne: ["$$game", null] },
            },
          },
        },
      },
    ]);

    if (games.length > 0) {
      if (creatorDesignation === "player" && Array.isArray(games)) {
        const formatGames = (gameList) =>
          gameList.map(({ _id, gameName, gameThumbnailUrl }) => ({
            _id,
            gameName,
            gameThumbnailUrl,
          }));

        return res.status(200).json({
          featured: formatGames(games[0].featured),
          otherGames: formatGames(games[0].otherGames),
        });
      } else if (creatorDesignation !== "player") {
        return res.status(200).json(games[0]);
      }
    }

    return res.status(200).json({ featured: [], otherGames: [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

    if (creatorRole != "company") {
      throw createHttpError(
        401,
        "Access denied : You dont have Permission to add Games"
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
  } catch (error) {}
};

export const deleteGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
