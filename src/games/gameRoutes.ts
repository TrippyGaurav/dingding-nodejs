import express from "express";
import { extractRoleFromCookie } from "../middleware/middlware";
import {
  addFavouriteGame,
  addGame,
  deleteGame,
  getAllGames,
  getGameById,
  updateGame,
  uploadThubnail,
} from "./gameController";
import determineOrigin from "../middleware/determineOrigin";

const gameRoutes = express.Router();

gameRoutes.get("/", extractRoleFromCookie, getAllGames);
gameRoutes.post("/", extractRoleFromCookie, addGame);
gameRoutes.put("/:gameId", extractRoleFromCookie, updateGame);
gameRoutes.delete("/:gameId", extractRoleFromCookie, deleteGame);
gameRoutes.get("/:gameId", extractRoleFromCookie, getGameById);
gameRoutes.post("/thumbnail", extractRoleFromCookie, uploadThubnail);
gameRoutes.put(
  "/:playerId/:gameId",
  determineOrigin,
  extractRoleFromCookie,
  addFavouriteGame
);

export default gameRoutes;
