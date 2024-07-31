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
const TestGlobal_1 = require("./game/TestGlobal");
const gameModel_1 = require("./dashboard/games/gameModel");
// import { Payouts } from "./dashboard/games/gameModel";
const slotGame_1 = __importDefault(require("./dashboard/games/slotGame"));
const testData_1 = require("./game/slotBackend/testData");
const socket_1 = require("./socket");
const payoutController_1 = __importDefault(require("./dashboard/payouts/payoutController"));
class Player {
    constructor(username, role, credits, userAgent, gameSocket) {
        this.currentGame = null;
        this.reconnectionAttempts = 0;
        this.maxReconnectionAttempts = 1;
        this.reconnectionTimeout = 3000; // 5 seconds
        this.cleanedUp = false;
        this.username = username;
        this.role = role;
        this.credits = credits;
        this.userAgent = userAgent;
        this.gameSocket = gameSocket;
        this.initializeGameSocket(gameSocket);
    }
    initializeGameSocket(socket) {
        this.gameSocket = socket;
        this.cleanedUp = false; // Reset the cleanup flag
        this.gameSocket.on("disconnect", () => this.handleGameDisconnection());
        this.initGameData();
        this.startHeartbeat();
        this.onExit();
        socket.emit("socketState", true);
        console.log(`User ${this.username} initialized with game socket ID: ${this.gameSocket.id}`);
    }
    handleGameDisconnection() {
        console.log(`User ${this.username} disconnected from game. Attempting to reconnect...`);
        this.attemptReconnection();
    }
    attemptReconnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                while (this.reconnectionAttempts < this.maxReconnectionAttempts) {
                    yield new Promise(resolve => setTimeout(resolve, this.reconnectionTimeout));
                    this.reconnectionAttempts++;
                    if (this.cleanedUp) {
                        console.log(`Reconnection halted for user ${this.username} as cleanup is done.`);
                        return;
                    }
                    if (this.gameSocket && this.gameSocket.connected) {
                        console.log(`User ${this.username} reconnected successfully.`);
                        this.reconnectionAttempts = 0;
                        return;
                    }
                    console.log(`Reconnection attempt ${this.reconnectionAttempts} for user ${this.username}...`);
                }
                console.log(`User ${this.username} failed to reconnect after ${this.maxReconnectionAttempts} attempts.`);
                socket_1.users.delete(this.username);
                this.cleanup();
            }
            catch (error) {
                console.log("ERROR: Attempt to reconnect:", error);
            }
        });
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.gameSocket) {
                this.sendAlert(`I'm Alive ${this.username}`);
            }
        }, 20000); // 20 seconds
    }
    sendAlert(message) {
        if (this.gameSocket) {
            this.gameSocket.emit("alert", message);
        }
    }
    cleanup() {
        if (this.gameSocket) {
            this.gameSocket.disconnect(true);
            this.gameSocket = null;
        }
        clearInterval(this.heartbeatInterval);
        this.username = "";
        this.role = "";
        this.credits = 0;
        this.userAgent = "";
        this.gameSettings = null;
        this.currentGame = null;
        this.reconnectionAttempts = 0;
        this.cleanedUp = true; // Set the cleanup flag
    }
    onExit() {
        if (this.gameSocket) {
            this.gameSocket.on("EXIT", () => {
                socket_1.users.delete(this.username);
                this.cleanup();
                console.log("User exited");
                console.log("USERS : ", socket_1.users);
            });
        }
    }
    updateGameSocket(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            if (socket.request.headers['user-agent'] !== this.userAgent) {
                socket.emit("alert", { id: "AnotherDevice", message: "You are already playing on another browser" });
                socket.disconnect(true);
                return;
            }
            this.initializeGameSocket(socket);
            const credits = yield (0, TestGlobal_1.getPlayerCredits)(this.username);
            this.credits = typeof credits === "number" ? credits : 0;
        });
    }
    initGameData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.gameSocket)
                return;
            this.gameSocket.on("AUTH", (message) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const res = JSON.parse(message);
                    const tagName = res.Data.GameID;
                    const platform = yield gameModel_1.Platform.aggregate([
                        { $unwind: "$games" },
                        { $match: { "games.tagName": tagName, "games.status": 'active' } },
                        { $project: { _id: 0, game: "$games" } },
                    ]);
                    console.log("Platform : ", platform);
                    // For Development only
                    if (platform.length == 0) {
                        this.gameSettings = Object.assign({}, testData_1.gameData[0]);
                        this.currentGame = new slotGame_1.default({ username: this.username, credits: this.credits, socket: this.gameSocket }, this.gameSettings);
                        return;
                    }
                    const game = platform[0].game;
                    console.log("game : ", game);
                    const payout = yield payoutController_1.default.getPayoutVersionData(game.tagName, game.payout);
                    if (!payout) {
                        this.gameSettings = Object.assign({}, testData_1.gameData[0]);
                        this.currentGame = new slotGame_1.default({ username: this.username, credits: this.credits, socket: this.gameSocket }, this.gameSettings);
                        return;
                    }
                    this.gameSettings = Object.assign({}, payout);
                    this.currentGame = new slotGame_1.default({ username: this.username, credits: this.credits, socket: this.gameSocket }, this.gameSettings);
                }
                catch (error) {
                    console.error(`Error initializing game data for user ${this.username}:`, error);
                }
            }));
        });
    }
}
exports.default = Player;
