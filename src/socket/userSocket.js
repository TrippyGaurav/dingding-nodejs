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
Object.defineProperty(exports, "__esModule", { value: true });
exports.betMultiplier = exports.SocketUser = exports.users = void 0;
exports.initializeUser = initializeUser;
exports.sendAlert = sendAlert;
exports.sendMessage = sendMessage;
const utils_1 = require("../utils/utils");
const playerAuth_1 = require("../utils/playerAuth");
const userModel_1 = require("../dashboard/users/userModel");
exports.users = new Map();
const testData_1 = require("../game/slotBackend/testData");
const gameModel_1 = require("../dashboard/games/gameModel");
const Global_1 = require("../game/Global");
const globalTypes_1 = require("../game/Utils/globalTypes");
const slotMessages_1 = require("../game/slotBackend/slotMessages");
const _global_1 = require("../game/slotBackend/_global");
const kenoMessages_1 = require("../game/kenoBackend/kenoMessages");
const gameModel_2 = require("../dashboard/games/gameModel");
class SocketUser {
    constructor(socket, GameData) {
        var _a, _b;
        this.GameData = GameData;
        this.isAlive = false;
        this.initGameData = (message) => __awaiter(this, void 0, void 0, function* () {
            try {
                const messageData = JSON.parse(message);
                const tagName = messageData.Data.GameID;
                const platform = yield gameModel_2.Platform.aggregate([
                    { $unwind: "$games" },
                    { $match: { "games.tagName": tagName } },
                    {
                        $project: {
                            _id: 0,
                            game: "$games"
                        }
                    }
                ]);
                const game = platform[0].game;
                // console.log(game, "Game");
                if (!game || !game.payout) {
                    console.log('NO GAME FOUND WITH THIS GAME ID, SWIFTING PAYOUTS TO SL-VIK');
                    _global_1.slotGameSettings.initiate(this.socket, testData_1.gameData[0], this.socket.id);
                    return;
                }
                const payoutData = yield gameModel_1.Payouts.find({ _id: { $in: game.payout } });
                const gameType = tagName.split('-');
                this.gameTag = gameType[0];
                if (gameType == globalTypes_1.GAMETYPE.SLOT)
                    console.log('SLOT INITITATED');
                _global_1.slotGameSettings.initiate(this.socket, payoutData[0].data, this.socket.id);
                if (gameType == globalTypes_1.GAMETYPE.KENO) {
                    console.log("KENO  GAME INITITATED");
                }
            }
            catch (error) {
                console.error('Error initializing game data:', error);
            }
        });
        this.sendError = (errorCode, message) => {
            const params = {
                errorCode: errorCode,
                message: message,
            };
            console.log("ERROR " + errorCode + "  :  " + message);
            this.socket.emit("internalError" /* MESSAGETYPE.ERROR */, params);
        };
        this.heartbeat = () => {
            this.isAlive = true;
        };
        this.messageHandler = () => {
            return (message) => {
                const messageData = JSON.parse(message);
                console.log("message " + JSON.stringify(messageData));
                if (this.gameTag == globalTypes_1.GAMETYPE.SLOT)
                    (0, slotMessages_1.slotMessages)(this.socket, this.socket.id, messageData);
                if (this.gameTag == globalTypes_1.GAMETYPE.KENO)
                    (0, kenoMessages_1.kenoMessages)(this.socket, messageData);
            };
        };
        this.handleAuth = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const CurrentUser = yield userModel_1.Player.findOne({
                    username: this.username,
                }).exec();
                if (CurrentUser) {
                    Global_1.PlayerData.Balance = CurrentUser.credits;
                    console.log("BALANCE " + Global_1.PlayerData.Balance);
                    // console.log(this.username);
                    // console.log("Player Balance users", CurrentUser.credits);
                    sendMessage(this.socket, utils_1.MESSAGEID.AUTH, CurrentUser.credits);
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
        this.deleteUserFromMap = () => {
            const clientID = this.socket.id;
            if (exports.users.get(clientID)) {
                exports.users.delete(clientID);
                console.log(`User with ID ${clientID} was successfully removed.`);
            }
            else {
                console.log(`No user found with ID ${clientID}.`);
            }
        };
        this.isAlive = true;
        this.socket = socket;
        this.username = (_a = socket.data) === null || _a === void 0 ? void 0 : _a.username;
        this.role = (_b = socket.data) === null || _b === void 0 ? void 0 : _b.role;
        this.handleAuth();
        this.socket.on("pong", this.heartbeat);
        this.socket.on(utils_1.MESSAGEID.AUTH, this.initGameData);
        this.socket.on("message", this.messageHandler());
        this.socket.on("disconnect", () => this.deleteUserFromMap());
    }
    deductPlayerBalance(credit) {
        this.checkBalance();
        Global_1.PlayerData.Balance -= credit;
        this.updateCreditsInDb();
    }
    updatePlayerBalance(credit) {
        Global_1.PlayerData.Balance += credit;
        Global_1.PlayerData.haveWon += credit;
        Global_1.PlayerData.currentWining = credit;
        this.updateCreditsInDb();
    }
    //Update player credits case win ,bet,and lose;
    updateCreditsInDb() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(Global_1.PlayerData.Balance, "finalbalance");
            yield userModel_1.Player.findOneAndUpdate({ username: this.username }, {
                credits: Global_1.PlayerData.Balance,
            });
        });
    }
    checkBalance() {
        // if(playerData.Balance < gameWining.currentBet)
        if (Global_1.PlayerData.Balance < _global_1.slotGameSettings.currentBet) {
            // Alerts(clientID, "Low Balance");
            sendMessage(this.socket, "low-balance", true);
            console.log(Global_1.PlayerData.Balance, "player balance");
            console.log(_global_1.slotGameSettings.currentBet, "currentbet");
            console.warn("LOW BALANCE ALErt");
            console.error("Low Balance ALErt");
            return;
        }
    }
}
exports.SocketUser = SocketUser;
function initializeUser(socket) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const decoded = yield (0, playerAuth_1.verifySocketToken)(socket);
            socket.data.username = decoded.username;
            socket.data.designation = decoded.role;
            Global_1.GData.playerSocket = new SocketUser(socket, socket);
            exports.users.set(Global_1.GData.playerSocket.socket.id, Global_1.GData.playerSocket);
            // Send the game and payout data to the client
            // socket.emit("initialize", { game, payoutData });
        }
        catch (err) {
            console.error(err.message);
            socket.disconnect();
        }
    });
}
function sendAlert(skt, message) {
    skt.emit("alert" /* MESSAGETYPE.ALERT */, message);
}
function sendMessage(skt, id, message) {
    skt.emit("message" /* MESSAGETYPE.MESSAGE */, JSON.stringify({ id, message }));
}
exports.betMultiplier = [0.1, 0.25, 0.5, 0.75, 1];
