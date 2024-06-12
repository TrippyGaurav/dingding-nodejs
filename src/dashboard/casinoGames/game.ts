import { NextFunction, Request, Response } from "express";
import { Game, GameImage } from "./gamesModel";
import createHttpError from "http-errors";
class GameController {
  constructor() {}
  async sendGames(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const {
      gameId,
      gameName,
      gameThumbnailUrl,
      gameHostLink,
      type,
      category,
      creatorDesignation,
    } = req.body;

    if (creatorDesignation !== "company") {
      return next(
        createHttpError(
          401,
          "You are not authorized to perform this action. Please contact your company"
        )
      );
    }

    try {
      const game = new Game({
        gameId,
        gameName,
        gameThumbnailUrl,
        gameHostLink,
        type,
        category,
      });
      const savedGame = await game.save();
      res.status(201).json(savedGame);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
