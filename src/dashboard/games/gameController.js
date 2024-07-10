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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFavouriteGame = exports.uploadThubnail = exports.getGameById = exports.deleteGame = exports.updateGame = exports.addGame = exports.getAllGames = void 0;
const gameModel_1 = require("./gameModel");
const gameModel_2 = __importDefault(require("./gameModel"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const utils_1 = require("../../utils/utils");
const userModel_1 = require("../users/userModel");
// DONE
const getAllGames = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category } = req.query;
        const { creatorRole, creatorUsername } = req.body;
        // Base match stage
        let matchStage = {};
        if (category) {
            matchStage.category = category;
        }
        // Determine the type of response based on the user's role
        if (creatorRole === "company") {
            // Company: send all games in a single array
            const games = yield gameModel_2.default.aggregate([{ $match: matchStage }]);
            return res.status(200).json(games);
        }
        else if (creatorRole === "player") {
            // Player: send games split into featured and others
            const games = yield gameModel_2.default.aggregate([
                { $match: matchStage },
                {
                    $sort: { createdAt: -1 },
                },
                {
                    $facet: {
                        featured: [{ $limit: 5 }],
                        others: [{ $skip: 5 }],
                    },
                },
            ]);
            return res.status(200).json(games[0] || { featured: [], others: [] });
        }
        else {
            return res.status(400).json({ error: "Invalid creatorRole" });
        }
    }
    catch (error) {
        console.error("Error fetching games:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getAllGames = getAllGames;
// DONE
const addGame = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, thumbnail, url, type, category, status, tagName, slug, creatorUsername, creatorRole, } = req.body;
        if (!name ||
            !thumbnail ||
            !url ||
            !type ||
            !category ||
            !status ||
            !tagName ||
            !slug ||
            !req.file) {
            throw (0, http_errors_1.default)(400, "All required fields must be provided, including the payout file");
        }
        if (req.file) {
            console.log("Receiced payout file");
        }
        if (creatorRole !== "company") {
            throw (0, http_errors_1.default)(401, "Access denied: You don't have permission to add games");
        }
        const existingGame = yield gameModel_2.default.findOne({ $or: [{ name }, { slug }] });
        if (existingGame) {
            throw (0, http_errors_1.default)(409, "Game with the same name or slug already exists");
        }
        // Handle file for payout
        const jsonData = JSON.parse(req.file.buffer.toString("utf-8"));
        const newPayout = new gameModel_1.Payouts({
            gameName: tagName,
            data: jsonData,
        });
        yield newPayout.save();
        const game = new gameModel_2.default({
            name,
            thumbnail,
            url,
            type,
            category,
            status,
            tagName,
            slug,
            payout: newPayout._id,
        });
        console.log("Game : ", game);
        const savedGame = yield game.save();
        console.log("Saved : ", savedGame);
        res.status(201).json(savedGame);
    }
    catch (error) {
        console.log(error);
        next(error);
    }
});
exports.addGame = addGame;
// DONE
const updateGame = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gameId } = req.params;
        const _a = req.body, { creatorRole, status, slug } = _a, updateFields = __rest(_a, ["creatorRole", "status", "slug"]);
        if (!gameId) {
            throw (0, http_errors_1.default)(400, "Game ID is required");
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(gameId)) {
            throw (0, http_errors_1.default)(400, "Invalid Game ID format");
        }
        if (creatorRole !== "company") {
            throw (0, http_errors_1.default)(401, "Access denied: You don't have permission to update games");
        }
        // Check if the game exists
        const game = yield gameModel_2.default.findById(gameId);
        if (!game) {
            throw (0, http_errors_1.default)(404, "Game not found");
        }
        // Validate the status field
        if (status && !["active", "inactive"].includes(status)) {
            throw (0, http_errors_1.default)(400, "Invalid status value. It should be either 'active' or 'inactive'");
        }
        // Ensure slug is unique if it is being updated
        if (slug && slug !== game.slug) {
            const existingGameWithSlug = yield gameModel_2.default.findOne({ slug });
            if (existingGameWithSlug) {
                throw (0, http_errors_1.default)(400, "Slug must be unique");
            }
        }
        // Ensure only existing fields in the document are updated
        const fieldsToUpdate = Object.keys(updateFields).reduce((acc, key) => {
            if (game[key] !== undefined) {
                acc[key] = updateFields[key];
            }
            return acc;
        }, {});
        // Include status and slug fields if they are valid
        if (status) {
            fieldsToUpdate.status = status;
        }
        if (slug) {
            fieldsToUpdate.slug = slug;
        }
        // Handle file for payout update
        if (req.file) {
            // Delete the old payout
            if (game.payout) {
                yield gameModel_1.Payouts.findByIdAndDelete(game.payout);
            }
            // Add the new payout
            const jsonData = JSON.parse(req.file.buffer.toString("utf-8"));
            const newPayout = new gameModel_1.Payouts({
                gameName: game.name,
                data: jsonData,
            });
            yield newPayout.save();
            fieldsToUpdate.payout = newPayout._id;
        }
        // If no valid fields to update, return an error
        if (Object.keys(fieldsToUpdate).length === 0) {
            throw (0, http_errors_1.default)(400, "No valid fields to update");
        }
        const updatedGame = yield gameModel_2.default.findByIdAndUpdate(gameId, { $set: fieldsToUpdate }, { new: true });
        res.status(200).json(updatedGame);
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.CastError) {
            next((0, http_errors_1.default)(400, "Invalid Game ID"));
        }
        else {
            next(error);
        }
    }
});
exports.updateGame = updateGame;
// DONE
const deleteGame = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gameId } = req.params;
        const { creatorRole } = req.body;
        if (!gameId) {
            throw (0, http_errors_1.default)(400, "Game ID is required");
        }
        if (creatorRole !== "company") {
            throw (0, http_errors_1.default)(401, "Access denied: You don't have permission to delete games");
        }
        const deletedGame = yield gameModel_2.default.findByIdAndDelete(gameId);
        if (!deletedGame) {
            throw (0, http_errors_1.default)(404, "Game not found");
        }
        res.status(200).json({ message: "Game deleted successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteGame = deleteGame;
// DONE
const getGameById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gameId } = req.params;
        if (!gameId) {
            throw (0, http_errors_1.default)(400, "Game ID is required");
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(gameId)) {
            throw (0, http_errors_1.default)(400, "Invalid Game ID format");
        }
        const game = yield gameModel_2.default.findById(gameId);
        if (!game) {
            throw (0, http_errors_1.default)(404, "Game not found");
        }
        if (game.status === "active") {
            res.status(200).json({ url: game.url });
        }
        else {
            res
                .status(200)
                .json({ message: "This game is currently under maintenance" });
        }
    }
    catch (error) {
        next(error);
    }
});
exports.getGameById = getGameById;
const uploadThubnail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body.image) {
        return res.status(400).json({ error: "Please upload the image" });
    }
    try {
        const image = req.body.image;
        const imageUrl = yield (0, utils_1.uploadImage)(image);
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
exports.uploadThubnail = uploadThubnail;
const addFavouriteGame = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { playerId } = req.params;
        const { gameId, type } = req.body;
        if (!playerId || !gameId) {
            throw (0, http_errors_1.default)(400, "Player ID and Game ID are required");
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(playerId)) {
            throw (0, http_errors_1.default)(400, "Invalid Player ID format");
        }
        if (type !== "add" && type !== "remove") {
            throw (0, http_errors_1.default)(400, "Invalid type value. It should be either 'add' or 'remove'");
        }
        const player = yield userModel_1.Player.findById(playerId);
        if (!player) {
            throw (0, http_errors_1.default)(404, "Player not found");
        }
        if (type === "add") {
            if (!player.favouriteGames.includes(gameId)) {
                player.favouriteGames.push(gameId);
            }
        }
        else if (type === "remove") {
            player.favouriteGames = player.favouriteGames.filter((id) => id !== gameId);
        }
        yield player.save();
        res.status(200).json(player);
    }
    catch (error) {
        next(error);
    }
});
exports.addFavouriteGame = addFavouriteGame;
