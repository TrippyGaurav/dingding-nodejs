"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tokenAuth_1 = require("../../middleware/tokenAuth");
const gamesController_1 = require("./gamesController");
const auth_1 = require("../../middleware/auth");
const Games = express_1.default.Router();
//POST ROUTES
Games.post("/add", tokenAuth_1.verifyToken, gamesController_1.sendGames);
//GET ROUTES
Games.get("/getGames", auth_1.verifyAuth, gamesController_1.getGames);
//PUT REQUEST
Games.put("/changes", auth_1.verifyAuth, gamesController_1.changeGames);
exports.default = Games;
