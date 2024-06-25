import express from "express";
import { extractRoleFromCookie } from "../middleware/middlware";
import { addGame, deleteGame, getAllGames, updateGame } from "./gameController";

const gameRoutes = express.Router();

gameRoutes.get("/", extractRoleFromCookie, getAllGames);
gameRoutes.post("/", extractRoleFromCookie, addGame);
gameRoutes.put("/:gameId", extractRoleFromCookie, updateGame);
gameRoutes.delete("/:gameId", extractRoleFromCookie, deleteGame);

export default gameRoutes;
