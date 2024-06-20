import express from "express";
import { verifyToken } from "../../middleware/tokenAuth";
import {
  getGames,
  sendGames,
  changeGames,
  image,
  favourite,
  getGameById,
  payoutFiles,
} from "./gamesController";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

import { verifyAuth } from "../../middleware/auth";
const Games = express.Router();
//POST ROUTES
Games.post("/add", verifyToken, sendGames);
Games.post("/payout", upload.single("file"), payoutFiles);
//GET ROUTES
Games.get("/getGames", verifyToken, getGames);
Games.get("/getGames/:id", verifyToken, getGameById);

Games.post("/upload", image);
Games.post("/favourite", verifyToken, favourite);
//PUT REQUEST
Games.put("/changes", verifyAuth, changeGames);

export default Games;
