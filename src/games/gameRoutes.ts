import express from "express";
import { extractRoleFromCookie } from "../middleware/middlware";
import { addGame, getAllGames } from "./gameController";

const gameRoutes = express.Router();

gameRoutes.get("/", extractRoleFromCookie, getAllGames);
gameRoutes.post("/", extractRoleFromCookie, addGame);

export default gameRoutes;
