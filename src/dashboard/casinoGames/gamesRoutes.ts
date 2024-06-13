import express from "express";
import { verifyToken } from "../../middleware/tokenAuth";
import {
  getGames,
  sendGames,
  changeGames,
  image,
  favourite,
} from "./gamesController";
import { verifyAuth } from "../../middleware/auth";
const Games = express.Router();
//POST ROUTES
Games.post("/add", verifyToken, sendGames);
//GET ROUTES
Games.get("/getGames", verifyToken, getGames);
Games.post("/upload", image);
Games.post("/favourite", verifyToken, favourite);
//PUT REQUEST
Games.put("/changes", verifyAuth, changeGames);
export default Games;
