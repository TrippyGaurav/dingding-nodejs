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
exports.users = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = require("./dashboard/users/userModel");
const config_1 = require("./config/config");
const Player_1 = __importDefault(require("./Player"));
exports.users = new Map();
const verifySocketToken = (socket) => {
    return new Promise((resolve, reject) => {
        const token = socket.handshake.auth.token;
        if (token) {
            jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret, (err, decoded) => {
                if (err) {
                    console.error("Token verification failed:", err.message);
                    reject(new Error("You are not authenticated"));
                }
                else if (!decoded || !decoded.username) {
                    reject(new Error("Token does not contain required fields"));
                }
                else {
                    resolve(decoded);
                }
            });
        }
        else {
            reject(new Error("No authentication token provided"));
        }
    });
};
const getUserCredits = (username) => __awaiter(void 0, void 0, void 0, function* () {
    const player = yield userModel_1.Player.findOne({ username });
    if (player) {
        return player.credits;
    }
    throw new Error("User not found");
});
const socketController = (io) => {
    // Token verification middleware
    io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        const userAgent = socket.request.headers['user-agent'];
        try {
            const decoded = yield verifySocketToken(socket);
            const credits = yield getUserCredits(decoded.username);
            socket.decoded = Object.assign(Object.assign({}, decoded), { credits });
            socket.userAgent = userAgent;
            next();
        }
        catch (error) {
            console.error("Authentication error:", error.message);
            next(error);
        }
    }));
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const decoded = socket.decoded;
        if (!decoded || !decoded.username || !decoded.role) {
            console.error("Connection rejected: missing required fields in token");
            socket.disconnect(true);
            return;
        }
        const userAgent = socket.userAgent;
        const user = {
            username: decoded.username,
            role: decoded.role,
            credits: decoded.credits,
            userAgent: userAgent,
            socket: socket
        };
        io.emit("newConnectionAlert", "A new user has connected!");
        // enterPlayer(socket);
        try {
            const existingUser = exports.users.get(user.username);
            if (existingUser && existingUser.socket !== null) {
                if (existingUser.userAgent !== userAgent) {
                    socket.emit("alert", "You are already playing on another browser.");
                    socket.disconnect(true);
                    return;
                }
                yield existingUser.updateSocket(socket);
                existingUser.sendAlert(`Welcome back, ${user.username}!`);
                console.log(`Player ${user.username} re-entered the game.`);
            }
            else {
                const newUser = new Player_1.default(user.username, user.role, user.credits, user.userAgent, user.socket);
                exports.users.set(user.username, newUser);
                newUser.sendAlert(`Welcome, ${newUser.username}!`);
                console.log(`Player ${newUser.username} entered the game`);
            }
        }
        catch (error) {
            console.log("Error during player entry : ", error);
            if (socket.connected) {
                socket.emit("internalError", error.message);
            }
            socket.disconnect(true);
        }
    }));
    // Error handling middleware
    io.use((socket, next) => {
        socket.on('error', (err) => {
            console.error('Socket Error:', err);
            socket.disconnect(true);
        });
        next();
    });
};
exports.default = socketController;
