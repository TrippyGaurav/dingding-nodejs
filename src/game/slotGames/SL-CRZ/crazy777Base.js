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
exports.SLCRZ = void 0;
const RandomResultGenerator_1 = require("../RandomResultGenerator");
const types_1 = require("./types");
const helper_1 = require("./helper");
class SLCRZ {
    constructor(currentGameData) {
        this.currentGameData = currentGameData;
        this.playerData = {
            haveWon: 0,
            currentWining: 0,
            totalbet: 0,
            rtpSpinCount: 0,
            totalSpin: 0,
            currentPayout: 0
        };
        this.settings = (0, helper_1.initializeGameSettings)(currentGameData, this);
        (0, helper_1.generateInitialReel)(this.settings);
        (0, helper_1.sendInitData)(this);
    }
    get initSymbols() {
        const Symbols = [];
        this.currentGameData.gameSettings.Symbols.forEach((Element) => {
            Symbols.push(Element);
        });
        return Symbols;
    }
    sendMessage(action, message) {
        this.currentGameData.sendMessage(action, message);
    }
    sendError(message) {
        this.currentGameData.sendError(message);
    }
    sendAlert(message) {
        this.currentGameData.sendAlert(message);
    }
    updatePlayerBalance(amount) {
        this.currentGameData.updatePlayerBalance(amount);
    }
    deductPlayerBalance(amount) {
        this.currentGameData.deductPlayerBalance(amount);
    }
    getPlayerData() {
        return this.currentGameData.getPlayerData();
    }
    messageHandler(response) {
        switch (response.id) {
            case "SPIN":
                this.prepareSpin(response.data);
                this.spinResult();
                break;
        }
    }
    prepareSpin(data) {
        this.settings.currentLines = data.currentLines;
        this.settings.BetPerLines = this.settings.currentGamedata.bets[data.currentBet];
        this.settings.currentBet = this.settings.BetPerLines * this.settings.currentLines;
    }
    spinResult() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const playerData = this.getPlayerData();
                if (!this.settings.isFreeSpin && this.settings.currentBet > playerData.credits) {
                    this.sendError("Low Balance");
                    return;
                }
                if (!this.settings.isFreeSpin) {
                    yield this.deductPlayerBalance(this.settings.currentBet);
                    this.playerData.totalbet += this.settings.currentBet;
                }
                new RandomResultGenerator_1.RandomResultGenerator(this);
                this.checkResult();
            }
            catch (error) {
                this.sendError("Spin error");
                console.error("Failed to generate spin results:", error);
            }
        });
    }
    checkResult() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const resultmatrix = this.settings.resultSymbolMatrix;
                const checkMatrix = resultmatrix.map(row => row.slice(0, 3));
                const specialMatrix = resultmatrix.map(row => row[3]);
                console.log("Result Matrix:", resultmatrix);
                const middleRow = checkMatrix[1];
                const extrasymbol = specialMatrix[1];
                console.log("Middle row:", middleRow);
                console.log("Special element:", extrasymbol);
                if (middleRow.includes(0)) {
                    this.playerData.currentWining = 0;
                    (0, helper_1.makeResultJson)(this);
                    console.log("No win: '0' present in the middle row.");
                }
                const isWinning = yield (0, helper_1.checkWinningCondition)(this, middleRow);
                let payout = 0;
                switch (isWinning.winType) {
                    case types_1.WINNINGTYPE.REGULAR:
                        console.log("Regular Win! Calculating payout...");
                        payout = yield (0, helper_1.calculatePayout)(this, middleRow, isWinning.symbolId, types_1.WINNINGTYPE.REGULAR);
                        console.log("Payout:", payout);
                        break;
                    case types_1.WINNINGTYPE.MIXED:
                        console.log("Mixed Win! Calculating mixed payout...");
                        payout = yield (0, helper_1.calculatePayout)(this, middleRow, isWinning.symbolId, types_1.WINNINGTYPE.MIXED);
                        console.log("Mixed Payout:", payout);
                        break;
                    default:
                        console.log("No specific win condition met. Applying default payout.");
                        payout = this.settings.defaultPayout * this.settings.BetPerLines;
                        this.playerData.currentWining = payout;
                        console.log("Default Payout:", payout);
                        break;
                }
                if (payout > 0 && !this.settings.isFreeSpin) {
                    payout = yield (0, helper_1.applyExtraSymbolEffect)(this, payout, extrasymbol);
                    this.playerData.currentWining = payout;
                    (0, helper_1.makeResultJson)(this);
                }
                console.log("Total Payout for:", this.getPlayerData().username, "" + payout);
                console.log("Total Free Spins Remaining:", this.settings.freeSpinCount);
                if (this.settings.isFreeSpin) {
                    this.settings.freeSpinCount--;
                    //ON THE FUNCTION FOR TESTING PURPOSE ONLY
                    // this.spinResult()
                    if (this.settings.freeSpinCount === 0) {
                        this.settings.isFreeSpin = false;
                    }
                }
            }
            catch (error) {
                console.error("Error in checkResult:", error);
            }
        });
    }
}
exports.SLCRZ = SLCRZ;
