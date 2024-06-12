"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const GameSchema = new mongoose_1.default.Schema({
    gameId: { type: Number, required: true },
    gameName: { type: String, required: true },
    gameThumbnailUrl: { type: String, required: true },
    gameHostLink: { type: String, required: true },
    type: { type: String, required: true },
    category: { type: String, required: true },
    status: {
        type: Boolean,
        require: true,
        default: true,
    },
}, {
    timestamps: true,
});
const Game = mongoose_1.default.model("casinoGames", GameSchema);
exports.default = Game;
