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
const mongoose_1 = __importDefault(require("mongoose"));
const userModel_1 = require("./dashboard/users/userModel");
const gameModel_1 = require("./dashboard/games/gameModel");
const payoutController_1 = __importDefault(require("./dashboard/payouts/payoutController"));
const gameUtils_1 = require("./game/Utils/gameUtils");
const testData_1 = require("./game/testData");
const socket_1 = require("./socket");
const GameManager_1 = __importDefault(require("./game/GameManager"));
const http_errors_1 = __importDefault(require("http-errors"));
class PlayerSocket {
    constructor(username, role, credits, userAgent, gameSocket, gameId) {
        this.gameId = gameId;
        this.socketData = {
            gameSocket: null,
            heartbeatInterval: setInterval(() => { }, 0),
            reconnectionAttempts: 0,
            maxReconnectionAttempts: 5,
            reconnectionTimeout: 5000,
            cleanedUp: false,
        };
        this.playerData = {
            username,
            role,
            credits,
            userAgent
        };
        this.currentGameData = {
            currentGameManager: null, // Will be initialized later
            gameSettings: null,
            sendMessage: this.sendMessage.bind(this),
            sendError: this.sendError.bind(this),
            sendAlert: this.sendAlert.bind(this),
            updatePlayerBalance: this.updatePlayerBalance.bind(this),
            deductPlayerBalance: this.deductPlayerBalance.bind(this),
            getPlayerData: () => this.playerData,
            username: this.playerData.username
        };
        console.log("Welcome : ", this.playerData.username);
        this.initializeGameSocket(gameSocket);
    }
    initializeGameSocket(socket) {
        this.socketData.gameSocket = socket;
        this.gameId = socket.handshake.auth.gameId;
        this.socketData.gameSocket.on("disconnect", () => this.handleGameDisconnection());
        this.initGameData();
        this.startHeartbeat();
        this.onExit();
        this.messageHandler();
        socket.emit("socketState", true);
    }
    handleGameDisconnection() {
        this.attemptReconnection();
    }
    sendMessage(action, message) {
        this.socketData.gameSocket.emit("message" /* messageType.MESSAGE */, JSON.stringify({
            id: action,
            message,
            username: this.playerData.username,
        }));
    }
    sendError(message) {
        this.socketData.gameSocket.emit("internalError" /* messageType.ERROR */, message);
    }
    sendAlert(message) {
        this.socketData.gameSocket.emit("alert", message);
    }
    messageHandler() {
        this.socketData.gameSocket.on("message", (message) => {
            try {
                const response = JSON.parse(message);
                console.log(`Message Recieved for ${this.playerData.username} : `, message);
                this.currentGameData.currentGameManager.currentGameType.currentGame.messageHandler(response);
            }
            catch (error) {
                console.error("Failed to parse message:", error);
                this.sendError("Failed to parse message");
            }
        });
    }
    updateDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            try {
                session.startTransaction();
                const finalBalance = this.playerData.credits;
                yield userModel_1.Player.findOneAndUpdate({ username: this.playerData.username }, { credits: finalBalance.toFixed(2) }, { new: true, session });
                yield session.commitTransaction();
            }
            catch (error) {
                yield session.abortTransaction();
                console.error("Failed to update database:", error);
                this.sendError("Database error");
            }
            finally {
                session.endSession();
            }
        });
    }
    checkPlayerBalance(bet) {
        if (this.playerData.credits < bet) {
            this.sendMessage("low-balance", true);
            console.error("LOW BALANCE");
        }
    }
    updatePlayerBalance(credit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.playerData.credits += credit;
                yield this.updateDatabase();
            }
            catch (error) {
                console.error("Error updating credits in database:", error);
            }
        });
    }
    deductPlayerBalance(currentBet) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkPlayerBalance(currentBet);
            this.playerData.credits -= currentBet;
            // await this.updateDatabase();
        });
    }
    attemptReconnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                while (this.socketData.reconnectionAttempts < this.socketData.maxReconnectionAttempts) {
                    yield new Promise((resolve) => setTimeout(resolve, this.socketData.reconnectionTimeout));
                    this.socketData.reconnectionAttempts++;
                    if (this.socketData.cleanedUp)
                        return;
                    if (this.socketData.gameSocket && this.socketData.gameSocket.connected) {
                        this.socketData.reconnectionAttempts = 0;
                        return;
                    }
                }
                socket_1.users.delete(this.playerData.username);
                this.cleanup();
                throw (0, http_errors_1.default)(403, "Please wait to disconnect");
            }
            catch (error) {
                console.error("Reconnection attempt failed:", error);
            }
        });
    }
    startHeartbeat() {
        this.socketData.heartbeatInterval = setInterval(() => {
            if (this.socketData.gameSocket) {
                this.sendAlert(`I'm Alive ${this.playerData.username}`);
            }
        }, 20000); // 20 seconds
    }
    cleanup() {
        if (this.socketData.gameSocket) {
            this.socketData.gameSocket.disconnect(true);
            this.socketData.gameSocket = null;
        }
        clearInterval(this.socketData.heartbeatInterval);
        this.playerData = {
            username: "",
            role: "",
            credits: 0,
            userAgent: ""
        };
        this.gameId = null;
        this.currentGameData = {
            currentGameManager: null,
            gameSettings: null,
            sendMessage: this.sendMessage.bind(this),
            sendError: this.sendError.bind(this),
            sendAlert: this.sendAlert.bind(this),
            updatePlayerBalance: this.updatePlayerBalance.bind(this),
            deductPlayerBalance: this.deductPlayerBalance.bind(this),
            getPlayerData: () => this.playerData,
            username: this.playerData.username,
        };
        this.socketData = Object.assign(Object.assign({}, this.socketData), { reconnectionAttempts: 0, cleanedUp: true });
    }
    onExit() {
        var _a;
        (_a = this.socketData.gameSocket) === null || _a === void 0 ? void 0 : _a.on("EXIT", () => {
            console.log(this.playerData.username, "EXITS FROM", this.gameId);
            this.sendMessage('ExitUser', '');
            socket_1.users.delete(this.playerData.username);
            this.cleanup();
        });
    }
    forceExit() {
        this.sendAlert("ForcedExit");
        socket_1.users.delete(this.playerData.username);
        this.cleanup();
    }
    updateGameSocket(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            if (socket.request.headers["user-agent"] !== this.playerData.userAgent) {
                socket.emit("alert", {
                    id: "AnotherDevice",
                    message: "You are already playing on another browser",
                });
                socket.disconnect(true);
                throw (0, http_errors_1.default)(403, "You are already playing on another browser");
            }
            this.initializeGameSocket(socket);
            const credits = yield (0, gameUtils_1.getPlayerCredits)(this.playerData.username);
            this.playerData.credits = typeof credits === "number" ? credits : 0;
        });
    }
    initGameData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.socketData.gameSocket)
                return;
            try {
                const tagName = this.gameId;
                console.log(tagName);
                const platform = yield gameModel_1.Platform.aggregate([
                    { $unwind: "$games" },
                    { $match: { "games.tagName": tagName, "games.status": "active" } },
                    { $project: { _id: 0, game: "$games" } },
                ]);
                if (platform.length === 0) {
                    this.currentGameData.gameSettings = Object.assign({}, testData_1.gameData[0]);
                    this.currentGameData.currentGameManager = new GameManager_1.default(this.currentGameData);
                    return;
                }
                const game = platform[0].game;
                const payout = yield payoutController_1.default.getPayoutVersionData(game.tagName, game.payout);
                if (!payout) {
                    this.currentGameData.gameSettings = Object.assign({}, testData_1.gameData[0]);
                    this.currentGameData.currentGameManager = new GameManager_1.default(this.currentGameData);
                    return;
                }
                this.currentGameData.gameSettings = Object.assign({}, payout);
                this.currentGameData.currentGameManager = new GameManager_1.default(this.currentGameData);
            }
            catch (error) {
                console.error(`Error initializing game data for user ${this.playerData.username}:`, error);
            }
        });
    }
}
exports.default = PlayerSocket;
