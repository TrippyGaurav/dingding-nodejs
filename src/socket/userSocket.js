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
exports.betMultiplier = exports.SocketUser = exports.users = void 0;
exports.initializeUser = initializeUser;
exports.getClient = getClient;
const utils_1 = require("../utils/utils");
const global_1 = require("../game/global");
const rtpgenerator_1 = require("../game/rtpgenerator");
const playerAuth_1 = require("../utils/playerAuth");
const userModel_1 = require("../dashboard/users/userModel");
exports.users = new Map();
const gameModel_1 = require("../dashboard/games/gameModel");
// import { clientData } from "../dashboard/user/userController";
const testData_1 = require("../game/testData");
const gameModel_2 = __importDefault(require("../dashboard/games/gameModel"));
class SocketUser {
    constructor(socket, GameData) {
        var _a, _b;
        this.GameData = GameData;
        this.isAlive = false;
        this.initGameData = (message) => __awaiter(this, void 0, void 0, function* () {
            try {
                const messageData = JSON.parse(message);
                // Use "SL-VIK" as default tagName if messageData.Data.GameID is not present
                const tagName = messageData.Data.GameID;
                const game = yield gameModel_2.default.findOne({ tagName: tagName });
                console.log(game.payout, "Game");
                if (!game || !game.payout) {
                    console.log('NO GAME FOUND WITH THIS GAME ID, SWIFTING PAYOUTS TO SL-VIK');
                    global_1.gameSettings.initiate(testData_1.gameData[0], this.socket.id);
                    return;
                }
                // Retrieve the payout JSON data
                const payoutData = yield gameModel_1.Payouts.find({ _id: { $in: game.payout } });
                console.log(payoutData, "payout");
                global_1.gameSettings.initiate(payoutData[0].data, this.socket.id);
            }
            catch (error) {
                console.error('Error initializing game data:', error);
                // Handle error (e.g., send error response, disconnect socket, etc.)
            }
        });
        this.heartbeat = () => {
            this.isAlive = true;
        };
        this.messageHandler = () => {
            return (message) => {
                const messageData = JSON.parse(message);
                console.log("message " + JSON.stringify(messageData));
                if (messageData.id === "checkMoolah") {
                    (0, global_1.checkforMoolah)();
                }
                if (messageData.id === utils_1.MESSAGEID.SPIN && global_1.gameSettings.startGame) {
                    global_1.gameSettings.currentLines = messageData.data.currentLines;
                    global_1.gameSettings.BetPerLines = exports.betMultiplier[messageData.data.currentBet];
                    global_1.gameSettings.currentBet = exports.betMultiplier[messageData.data.currentBet] * global_1.gameSettings.currentLines;
                    (0, global_1.spinResult)(this.socket.id);
                }
                if (messageData.id == utils_1.MESSAGEID.GENRTP) {
                    global_1.gameSettings.currentLines = messageData.data.currentLines;
                    global_1.gameSettings.BetPerLines = exports.betMultiplier[messageData.data.currentBet];
                    global_1.gameSettings.currentBet = exports.betMultiplier[messageData.data.currentBet] * global_1.gameSettings.currentLines;
                    (0, rtpgenerator_1.getRTP)(this.socket.id, messageData.data.spins);
                }
                if (messageData.id === utils_1.MESSAGEID.GAMBLE) {
                }
            };
        };
        this.deleteUserFromMap = () => {
            // Attempt to delete the user from the map
            const clientID = this.socket.id;
            if (getClient(clientID)) {
                exports.users.delete(clientID);
                console.log(`User with ID ${clientID} was successfully removed.`);
            }
            else {
                console.log(`No user found with ID ${clientID}.`);
            }
        };
        this.isAlive = true;
        this.socket = socket;
        this.username = (_a = socket === null || socket === void 0 ? void 0 : socket.data) === null || _a === void 0 ? void 0 : _a.username;
        this.designation = (_b = socket === null || socket === void 0 ? void 0 : socket.data) === null || _b === void 0 ? void 0 : _b.designation;
        this.handleAuth();
        this.socket.on("pong", this.heartbeat);
        this.socket.on("message", this.messageHandler());
        this.socket.on(utils_1.MESSAGEID.AUTH, this.initGameData);
        this.socket.on("disconnect", () => this.deleteUserFromMap());
    }
    sendError(errorCode, message) {
        const params = {
            errorCode: errorCode,
            message: message,
        };
        console.log("ERROR " + errorCode + "  :  " + message);
        this.socket.emit("internalError" /* MESSAGETYPE.ERROR */, params);
    }
    sendAlert(message) {
        this.socket.emit("alert" /* MESSAGETYPE.ALERT */, message);
    }
    sendMessage(id, message) {
        this.socket.emit("message" /* MESSAGETYPE.MESSAGE */, JSON.stringify({ id, message }));
    }
    //to get the player initial balance after socket connection
    handleAuth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // const messageData = JSON.parse(message);
                const CurrentUser = yield userModel_1.Player.findOne({
                    username: this.username,
                }).exec();
                if (CurrentUser) {
                    global_1.playerData.Balance = CurrentUser.credits;
                    console.log("BALANCE " + global_1.playerData.Balance);
                    // console.log(this.username);
                    // console.log("Player Balance users", CurrentUser.credits);
                    this.sendMessage(utils_1.MESSAGEID.AUTH, CurrentUser.credits);
                }
                else {
                    this.sendError("USER_NOT_FOUND", "User not found in the database");
                }
            }
            catch (error) {
                console.error("Error handling AUTH message:", error);
                this.sendError("AUTH_ERROR", "An error occurred during authentication");
            }
        });
    }
    //Update player credits case win ,bet,and lose;
    updateCreditsInDb(finalBalance) {
        return __awaiter(this, void 0, void 0, function* () {
            const formattedNumber = finalBalance.toFixed(1);
            console.log(formattedNumber, "finalba;");
            yield userModel_1.Player.findOneAndUpdate({ username: this.username }, {
                credits: formattedNumber,
            });
        });
    }
}
exports.SocketUser = SocketUser;
function initializeUser(socket) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const decoded = yield (0, playerAuth_1.verifySocketToken)(socket);
            socket.data.username = decoded.username;
            socket.data.designation = decoded.designation;
            const user = new SocketUser(socket, socket);
            exports.users.set(user.socket.id, user);
            // Send the game and payout data to the client
            // socket.emit("initialize", { game, payoutData });
        }
        catch (err) {
            console.error(err.message);
            socket.disconnect();
        }
    });
}
function getClient(clientId) {
    const user = exports.users.get(clientId);
    return user;
}
exports.betMultiplier = [0.1, 0.5, 0.7, 1];
