import express from "express";
import { extractRoleFromCookie, validateApiKey } from "../middleware/middlware";
import {
  GameController,
  addFavouriteGame,
  deleteGame,
  getGameById,
  updateGame,
  uploadThubnail,
} from "./gameController";
import multer from "multer";
import { checkUser } from "../middleware/checkUser";

const gameController = new GameController()
const gameRoutes = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET : Get all Games
gameRoutes.get("/", validateApiKey, checkUser, gameController.getGames);

// POST : Add a Game
gameRoutes.post('/', upload.fields([{ name: 'thumbnail' }, { name: 'payoutFile' }]), checkUser, gameController.addGame);

// GET : Get All Platforms
gameRoutes.get("/platforms", checkUser, gameController.getPlatforms)

// POST : Add a Platform
gameRoutes.post("/platforms", checkUser, gameController.addPlatform)


gameRoutes.put("/:gameId", upload.fields([{ name: 'thumbnail' }, { name: 'payoutFile' }]), extractRoleFromCookie, updateGame);

gameRoutes.delete("/:gameId", extractRoleFromCookie, deleteGame);
gameRoutes.get("/:gameId", validateApiKey, extractRoleFromCookie, getGameById);
gameRoutes.post("/thumbnail", extractRoleFromCookie, uploadThubnail);
gameRoutes.put(
  "/favourite/:playerId",
  extractRoleFromCookie,
  addFavouriteGame
);


export default gameRoutes;
