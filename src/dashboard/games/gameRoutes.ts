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
import multer from "multer";

const gameRoutes = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

gameRoutes.get("/", extractRoleFromCookie, getAllGames);
gameRoutes.post("/", upload.single("file"), addGame);
gameRoutes.put(
  "/:gameId",
  upload.single("file"),
  extractRoleFromCookie,
  updateGame
);
gameRoutes.delete("/:gameId", extractRoleFromCookie, deleteGame);
gameRoutes.get("/:gameId", extractRoleFromCookie, getGameById);
gameRoutes.post("/thumbnail", extractRoleFromCookie, uploadThubnail);
gameRoutes.put(
  "/favourite/:playerId",
  determineOrigin,
  extractRoleFromCookie,
  addFavouriteGame
);

export default gameRoutes;
