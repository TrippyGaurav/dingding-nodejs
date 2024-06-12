import express from "express";
import { verifyToken } from "../../middleware/tokenAuth";
import { getGames, sendGames, changeGames, image } from "./gamesController";
import { verifyAuth } from "../../middleware/auth";
const Games = express.Router();
//POST ROUTES
Games.post("/add", verifyToken, sendGames);
//GET ROUTES
Games.get("/getGames", verifyAuth, getGames);
//PUT REQUEST
Games.put("/changes", verifyAuth, changeGames);
Games.post("/upload", image);
export default Games;
