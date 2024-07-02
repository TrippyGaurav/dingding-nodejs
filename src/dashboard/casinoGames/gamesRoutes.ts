import express from "express";
import { verifyToken } from "../middleware/tokenAuth";
import { favourite } from "./gamesController";
const Games = express.Router();
//POST ROUTES
//GET ROUTES

Games.post("/favourite", verifyToken, favourite);
//PUT REQUEST

export default Games;
