"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Platform = exports.Payouts = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PlatformSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    games: [{ type: mongoose_1.default.Types.ObjectId, ref: "Game" }]
});
const GameSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    thumbnail: {
        type: String,
        required: true,
        default: "https://res.cloudinary.com/dhl5hifpz/image/upload/v1718447154/casinoGames/jiddczkc9oxak77h88kg.png",
    },
    url: {
        type: String,
        required: true,
    },
    type: {
        type: String,
    },
    category: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: "active",
    },
    tagName: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true, // Ensure slug is unique
    },
    payout: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Payouts",
    },
}, { timestamps: true });
const PayoutsSchema = new mongoose_1.Schema({
    gameName: {
        type: String,
        required: true,
        unique: true,
    },
    data: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
}, { timestamps: true });
const Game = mongoose_1.default.model("Game", GameSchema);
const Payouts = mongoose_1.default.model("Payouts", PayoutsSchema);
exports.Payouts = Payouts;
const Platform = mongoose_1.default.model("Platform", PlatformSchema);
exports.Platform = Platform;
exports.default = Game;
