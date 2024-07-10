import express from "express";
import { extractRoleFromCookie } from "../middleware/middlware";
import {
  GameController,
  addFavouriteGame,
  deleteGame,
  getGameById,
  updateGame,
  uploadThubnail,
} from "./gameController";
import determineOrigin from "../middleware/determineOrigin";
import multer from "multer";
import { checkUser } from "../middleware/checkUser";

const gameController = new GameController()
const gameRoutes = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET : Get all Games
gameRoutes.get("/", checkUser, gameController.getGames);

// POST : Add a Game
gameRoutes.post("/", upload.single("file"), checkUser, gameController.addGame);

// GET : Get All Platforms
gameRoutes.get("/platforms", checkUser, gameController.getPlatforms)

// POST : Add a Platform
gameRoutes.post("/platforms", checkUser, gameController.addPlatform)


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
  extractRoleFromCookie,
  addFavouriteGame
);


export default gameRoutes;
