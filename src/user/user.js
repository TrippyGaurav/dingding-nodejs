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
exports.getClient = exports.initializeUser = exports.SocketUser = exports.users = void 0;
const utils_1 = require("../utils/utils");
const global_1 = require("../game/global");
const slotResults_1 = require("../game/slotResults");
const rtpgenerator_1 = require("../game/rtpgenerator");
const authMiddleware_1 = require("../middleware/authMiddleware");
const userModel_1 = __importDefault(require("../dashboard/user/userModel"));
const transactionModel_1 = __importDefault(require("../dashboard/transaction/transactionModel"));
exports.users = new Map();
class SocketUser {
    constructor(socket) {
        var _a, _b;
        this.isAlive = false;
        this.heartbeat = () => {
            this.isAlive = true;
        };
        this.messageHandler = () => {
            return (message) => {
                const messageData = JSON.parse(message);
                if (messageData.id === utils_1.MESSAGEID.SPIN && global_1.gameSettings.startGame) {
                    global_1.gameSettings.currentBet = messageData.data.currentBet;
                    new slotResults_1.CheckResult(this.socket.id);
                }
                if (messageData.id == utils_1.MESSAGEID.GENRTP) {
                    global_1.gameSettings.currentBet = messageData.data.currentBet;
                    (0, rtpgenerator_1.getRTP)(this.socket.id, messageData.data.spins);
                }
                if (messageData.id === utils_1.MESSAGEID.GAMBLE) {
                }
            };
        };
        //to get the player initial balance after socket connection
        this.handleAuth = (message) => __awaiter(this, void 0, void 0, function* () {
            try {
                const messageData = JSON.parse(message);
                global_1.gameSettings.initiate(messageData.Data.GameID, this.socket.id);
                const CurrentUser = yield userModel_1.default.findOne({
                    username: this.username,
                }).exec();
                if (CurrentUser) {
                    global_1.playerData.Balance = CurrentUser.credits;
                    console.log("Player Balance", CurrentUser.credits);
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
        // console.log(
        //   "Client if from users:",
        //   socket.id,
        //   this.username,
        //   this.designation
        // );
        socket.on("pong", this.heartbeat);
        socket.on("message", this.messageHandler());
        socket.on(utils_1.MESSAGEID.AUTH, this.handleAuth);
        socket.on("disconnect", () => this.deleteUserFromMap());
    }
    sendError(errorCode, message) {
        const params = {
            errorCode: errorCode,
            message: message,
        };
        this.socket.emit("internalError" /* MESSAGETYPE.ERROR */, params);
    }
    sendAlert(message) {
        this.socket.emit("alert" /* MESSAGETYPE.ALERT */, message);
    }
    sendMessage(id, message) {
        this.socket.emit("message" /* MESSAGETYPE.MESSAGE */, JSON.stringify({ id, message }));
    }
    //Update player credits case win ,bet,and lose;
    updateCreditsInDb(finalBalance) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield transactionModel_1.default.create({});
            yield userModel_1.default.findOneAndUpdate({ username: this.username }, {
                $push: { transactions: transaction._id },
                credits: finalBalance,
            }, { new: true });
        });
    }
}
exports.SocketUser = SocketUser;
function initializeUser(socket) {
    (0, authMiddleware_1.verifySocketToken)(socket)
        .then((decoded) => {
        socket.data.username = decoded.username;
        socket.data.designation = decoded.designation;
        const user = new SocketUser(socket);
        exports.users.set(user.socket.id, user);
    })
        .catch((err) => {
        console.error(err.message);
        socket.disconnect();
    });
}
exports.initializeUser = initializeUser;
function getClient(clientId) {
    const user = exports.users.get(clientId);
    return user;
}
exports.getClient = getClient;
