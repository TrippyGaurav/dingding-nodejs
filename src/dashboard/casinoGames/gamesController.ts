import Game from "./gamesModel";
import { NextFunction, Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../../config/config";
import { Player } from "../../users/userModel";

cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret,
});

export const favourite = async (req: Request, res: Response) => {
  const { username, gameId, type } = req.body;

  try {
    // Find the user by username
    const player = await Player.findOne({ username: username });
    if (!player) {
      return res.status(404).send({ message: "User not found" });
    }

    if (type === "Add") {
      // Check if the game is already in the user's favourites
      if (player.favouriteGames.includes(gameId)) {
        return res.status(400).send({ message: "Game already selected" });
      }
      // Add the game to the user's favourites
      await Player.findOneAndUpdate(
        { username: player.username },
        { $push: { favourite: gameId } },
        { new: true }
      );

      res.status(200).send({ message: "Game added to favourites" });
    } else if (type === "remove") {
      // Remove the game from the user's favourites
      await Player.findOneAndUpdate(
        { username: player.username },
        { $pull: { favourite: gameId } },
        { new: true }
      );

      return res.status(200).send({
        message: "Game removed from favourites",
      });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
};
//
const uploadImage = (image) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      image,
      { folder: "casinoGames" },
      (error, result) => {
        if (result && result.secure_url) {
          // console.log(result.secure_url);
          return resolve(result.secure_url);
        }
        console.log(error.message);
        return reject({ message: error.message });
      }
    );
  });
};
//
export const image = async (req: Request, res: Response) => {
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
