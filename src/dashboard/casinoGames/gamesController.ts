import Game from "./gamesModel";
import { NextFunction, Request, Response } from "express";

// Function to send games as JSON
export const sendGames = async (req: Request, res: Response) => {
  const {
    gameId,
    gameName,
    gameThumbnailUrl,
    gameHostLink,
    type,
    category,
    creatorDesignation,
  } = req.body;
  // Check if the user is from the company
  if (creatorDesignation !== "company") {
    return res.status(401).json({
      error:
        "You are not authorized to perform this action. Please contact your company.",
    });
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
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getGames = async (req: Request, res: Response) => {
  const { category } = req.query;
  try {
    let query: any = { status: true };
    if (category && category !== "all") {
      query["category"] = category;
    }
    const games = await Game.find(query);
    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const changeGames = async (req: Request, res: Response) => {
  try {
    const { _id, status, type } = req.body;

    if (type === "updateStatus") {
      const updatedGame = await updateGame(_id, status);
      if (!updatedGame) {
        return res.status(404).json({ message: "Game not found" });
      }
      return res.status(200).json({
        message: "Game status updated successfully",
        updatedGame: updatedGame,
      });
    }

    if (type === "deleteGame") {
      const deletedGame = await deleteGame(_id);
      if (!deletedGame) {
        return res.status(404).json({ message: "Game not found" });
      }
      return res.status(200).json({ message: "Game deleted successfully" });
    }

    return res.status(400).json({ message: "Invalid request type" });
  } catch (error) {
    console.error("Error updating game status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

async function updateGame(_id: string, status: string) {
  return await Game.findOneAndUpdate(
    { _id },
    { $set: { status } },
    { new: true }
  );
}

async function deleteGame(_id: string) {
  return await Game.findOneAndDelete({ _id });
}
