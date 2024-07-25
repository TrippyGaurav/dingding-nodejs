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
const Global_1 = require("./game/Global");
const gameModel_1 = require("./dashboard/games/gameModel");
const gameModel_2 = require("./dashboard/games/gameModel");
const slotGame_1 = __importDefault(require("./dashboard/games/slotGame"));
const testData_1 = require("./game/slotBackend/testData");
const socket_1 = require("./socket");
class Player {
    constructor(username, role, credits, userAgent, socket) {
        this.socketReady = false;
        this.currentGame = null;
        this.reconnectionAttempts = 0;
        this.maxReconnectionAttempts = 3;
        this.reconnectionTimeout = 5000; // 5 seconds
        this.socketReady = false;
        this.currentGame = null;
        this.reconnectionAttempts = 0;
        this.maxReconnectionAttempts = 3;
        this.reconnectionTimeout = 5000; // 5 seconds
        this.username = username;
        this.credits = credits;
        this.role = role;
        this.socket = socket;
        this.userAgent = userAgent;
        if (socket) {
            this.initializeSocket(socket);
        }
    }
    initializeSocket(socket) {
        this.socket = socket;
        this.socketReady = true;
        this.disconnectHandler();
        this.startHeartbeat();
        this.onExit();
        this.initGameData();
        socket.emit("socketState", this.socketReady);
        console.log(`User ${this.username} initialized with socket ID: ${this.socket.id}`);
    }
    initGameData() {
        this.socket.on("AUTH", (message) => __awaiter(this, void 0, void 0, function* () {
            try {
                const res = JSON.parse(message);
                const tagName = res.Data.GameID;
                const platform = yield gameModel_1.Platform.aggregate([
                    { $unwind: "$games" },
                    { $match: { "games.tagName": tagName, "games.status": 'active' } },
                    { $project: { _id: 0, game: "$games" } },
                ]);
                if (platform.length === 0) {
                    this.gameSettings = Object.assign({}, testData_1.gameData[0]);
                    new slotGame_1.default({ username: this.username, credits: this.credits, socket: this.socket }, this.gameSettings);
                    return;
                }
                const game = platform[0].game;
                const payoutData = yield gameModel_2.Payouts.find({ _id: { $in: game.payout } });
                this.gameSettings = Object.assign({}, payoutData[0].data);
                this.currentGame = new slotGame_1.default({ username: this.username, credits: this.credits, socket: this.socket }, this.gameSettings);
            }
            catch (error) {
                console.error(`Error initializing game data for user ${this.username}:`, error);
            }
        }));
    }
    sendAlert(message) {
        this.socket.emit("alert", message);
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.socket) {
                this.sendAlert(`I'm Alive ${this.username}`);
            }
        }, 20000); // 20 seconds
    }
    disconnectHandler() {
        this.socket.on("disconnect", (reason) => {
            console.log(`User ${this.username} disconnected. Attempting to reconnect...`);
            this.attemptReconnection();
        });
    }
    attemptReconnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                while (this.reconnectionAttempts < this.maxReconnectionAttempts) {
                    yield new Promise(resolve => setTimeout(resolve, this.reconnectionTimeout));
                    this.reconnectionAttempts++;
                    if (this.socket && this.socket.connected) {
                        console.log(`User ${this.username} reconnected successfully.`);
                        this.reconnectionAttempts = 0;
                        return;
                    }
                    console.log(`Reconnection attempt ${this.reconnectionAttempts} for user ${this.username}...`);
                }
                console.log(`User ${this.username} failed to reconnect after ${this.maxReconnectionAttempts} attempts.`);
                socket_1.users.delete(this.username);
                this.cleanup();
                console.log("Curren tser : ", this.username);
                console.log("Map : ", socket_1.users);
            }
            catch (error) {
                console.log("ERROR : Attempt to reconnect : ", error);
            }
        });
    }
    cleanup() {
        clearInterval(this.heartbeatInterval);
        // Nullify all properties to ensure the object is destroyed
        this.socket = null;
        this.username = null;
        this.role = null;
        this.credits = null;
        this.currentGame = null;
        this.platform = null;
        this.socketID = null;
        this.gameSettings = null;
        this.gameTag = null;
    }
    onExit() {
        this.socket.on("exit", () => {
            socket_1.users.delete(this.username);
            this.socket.disconnect();
            this.cleanup();
            console.log("User exited");
        });
    }
    updateSocket(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            this.socket = socket;
            this.socketID = socket.id;
            this.socketReady = true;
            this.disconnectHandler();
            this.startHeartbeat();
            this.onExit();
            try {
                const credits = yield (0, Global_1.getPlayerCredits)(this.username);
                this.credits = typeof credits === "number" ? credits : 0;
                // Reinitialize the game with the existing gameSettings and updated credits
                if (this.gameSettings && this.username) {
                    this.currentGame = new slotGame_1.default({ username: this.username, credits: this.credits, socket: this.socket }, this.gameSettings);
                }
            }
            catch (error) {
                console.error(`Error updating credits for user ${this.username}:`, error);
            }
        });
    }
}
exports.default = Player;
