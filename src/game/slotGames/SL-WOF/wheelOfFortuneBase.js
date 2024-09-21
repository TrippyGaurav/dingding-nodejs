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
exports.SLWOF = void 0;
const RandomResultGenerator_1 = require("../RandomResultGenerator");
const types_1 = require("./types");
const helper_1 = require("./helper");
class SLWOF {
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
                if (this.settings.currentBet > playerData.credits) {
                    this.sendError("Low Balance");
                    return;
                }
                yield this.deductPlayerBalance(this.settings.currentBet);
                this.playerData.totalbet += this.settings.currentBet;
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
                const resultMatrix = this.settings.resultSymbolMatrix;
                console.log("Result Matrix:", resultMatrix);
                const rows = resultMatrix.slice(1, 4);
                const winningRows = [];
                let totalPayout = 0;
                for (let index = 0; index < rows.length; index++) {
                    const row = rows[index];
                    console.log(`Checking Row ${index + 2}:`, row);
                    if (row.includes(0)) {
                        console.log(`No win: '0' present in row ${index + 2}.`);
                        continue;
                    }
                    const isWinning = yield (0, helper_1.checkWinningCondition)(this, row);
                    let payout = yield this.calculateRowPayout(row, isWinning);
                    payout = this.applySpecialSymbolMultipliers(row, payout);
                    if (payout > 0)
                        winningRows.push(index + 1);
                    console.log(`Row ${index + 2} Adjusted Payout:`, payout);
                    totalPayout += payout;
                }
                totalPayout += this.checkForBonusGame(rows);
                this.playerData.currentWining = totalPayout;
                this.playerData.haveWon += this.playerData.currentWining;
                console.log("Total Payout for all rows:", this.playerData.currentWining);
                this.updatePlayerBalance(this.playerData.currentWining);
                (0, helper_1.makeResultJson)(this, winningRows);
                this.settings.bonus = false;
                this.settings.bonusStopIndex = 0;
            }
            catch (error) {
                console.error("Error in checkResult:", error);
            }
        });
    }
    calculateRowPayout(row, isWinning) {
        return __awaiter(this, void 0, void 0, function* () {
            let payout = 0;
            switch (isWinning.winType) {
                case types_1.WINNINGTYPE.REGULAR:
                    console.log("Regular Win! Calculating payout...");
                    payout = yield (0, helper_1.calculatePayout)(this, row, isWinning.symbolId, types_1.WINNINGTYPE.REGULAR);
                    break;
                case types_1.WINNINGTYPE.MIXED:
                    console.log("Mixed Win! Calculating mixed payout...");
                    payout = yield (0, helper_1.calculatePayout)(this, row, isWinning.symbolId, types_1.WINNINGTYPE.MIXED);
                    break;
                default:
                    console.log("No specific win condition met. Applying default payout.");
                    payout = this.settings.defaultPayout * this.settings.BetPerLines;
                    break;
            }
            console.log(`Payout for row: ${payout}`);
            return payout;
        });
    }
    applySpecialSymbolMultipliers(row, payout) {
        const specialSymbolCount = row.filter(symbolId => {
            const symbol = this.settings.Symbols.find(sym => sym.Id === symbolId);
            return symbol && symbol.isSpecialWof;
        }).length;
        switch (specialSymbolCount) {
            case 1:
                payout *= 3;
                break;
            case 2:
                payout *= 9;
                break;
            case 3:
                payout *= 27;
                break;
            default:
                break;
        }
        console.log(`Adjusted payout with special symbols (${specialSymbolCount}):`, payout);
        return payout;
    }
    checkForBonusGame(rows) {
        const bonusSymbolsInRows = rows.flat().filter(symbolId => symbolId === 12).length;
        if (bonusSymbolsInRows >= 2) {
            console.log(`Bonus Game Triggered! Bonus symbol count: ${bonusSymbolsInRows}`);
            this.settings.isBonus = true;
            const bonusWin = (0, helper_1.triggerBonusGame)(this, this.settings);
            console.log(`Bonus Payout: ${bonusWin}`);
            return bonusWin;
        }
        return 0;
    }
}
exports.SLWOF = SLWOF;
