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
exports.PlayerData = exports.GData = void 0;
exports.getPlayerCredits = getPlayerCredits;
const userModel_1 = require("../dashboard/users/userModel");
exports.GData = {
    playerSocket: undefined,
};
exports.PlayerData = {
    Balance: 0,
    haveWon: 0,
    currentWining: 0
};
function getPlayerCredits(playerName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const currentUser = yield userModel_1.Player.findOne({ username: playerName }).exec();
            if (!currentUser) {
                return `No user found with playerName ${playerName}`;
            }
            return currentUser.credits;
        }
        catch (error) {
            console.error(`Error fetching credits for player ${playerName}:`, error);
            return `An error occurred while fetching credits for player ${playerName}.`;
        }
    });
}
