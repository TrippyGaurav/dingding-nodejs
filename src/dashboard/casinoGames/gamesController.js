"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.image = exports.changeGames = exports.getGames = exports.sendGames = void 0;
const gamesModel_1 = __importDefault(require("./gamesModel"));
const cloudinary_1 = require("cloudinary");
const config_1 = require("../../config/config");
cloudinary_1.v2.config({
    cloud_name: config_1.config.cloud_name,
    api_key: config_1.config.api_key,
    api_secret: config_1.config.api_secret,
});
// Function to send games as JSON
const sendGames = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { gameName, gameThumbnailUrl, gameHostLink, type, category, tagName, creatorDesignation, } = req.body;
    // Check if the user is from the company
    if (creatorDesignation !== "company") {
        return res.status(401).json({
            error: "You are not authorized to perform this action. Please contact your company.",
        });
    }
    try {
        const game = new gamesModel_1.default({
            gameName,
            gameThumbnailUrl,
            gameHostLink,
            type,
            category,
            tagName,
        });
        const savedGame = yield game.save();
        res.status(201).json(savedGame);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.sendGames = sendGames;
const getGames = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { category } = req.query;
    try {
        let query = { status: true };
        if (category && category !== "all") {
            query["category"] = category;
        }
        const games = yield gamesModel_1.default.find(query);
        res.status(200).json(games);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getGames = getGames;
const changeGames = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { _id, status, type } = req.body;
        if (type === "updateStatus") {
            const updatedGame = yield updateGame(_id, status);
            if (!updatedGame) {
                return res.status(404).json({ message: "Game not found" });
            }
            return res.status(200).json({
                message: "Game status updated successfully",
                updatedGame: updatedGame,
            });
        }
        if (type === "deleteGame") {
            const deletedGame = yield deleteGame(_id);
            if (!deletedGame) {
                return res.status(404).json({ message: "Game not found" });
            }
            return res.status(200).json({ message: "Game deleted successfully" });
        }
        return res.status(400).json({ message: "Invalid request type" });
    }
    catch (error) {
        console.error("Error updating game status:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.changeGames = changeGames;
function updateGame(_id, status) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield gamesModel_1.default.findOneAndUpdate({ _id }, { $set: { status } }, { new: true });
    });
}
function deleteGame(_id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield gamesModel_1.default.findOneAndDelete({ _id });
    });
}
//
const uploadImage = (image) => {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.upload(image, { folder: "casinoGames" }, (error, result) => {
            if (result && result.secure_url) {
                console.log(result.secure_url);
                return resolve(result.secure_url);
            }
            console.log(error.message);
            return reject({ message: error.message });
        });
    });
};
//
const image = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body.image) {
        return res.status(400).json({ error: "Please upload the image" });
    }
    try {
        const image = req.body.image;
        const imageUrl = yield uploadImage(image);
        res.json({
            message: "File uploaded successfully",
            imageUrl: imageUrl,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});
exports.image = image;
