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
exports.SLCM = void 0;
const RandomResultGenerator_1 = require("../RandomResultGenerator");
const types_1 = require("./types");
const helper_1 = require("./helper");
/**
 * Represents the Slot Machine Game Class for handling slot machine operations.
 */
class SLCM {
    constructor(currentGameData) {
        this.currentGameData = currentGameData;
        this.playerData = {
            haveWon: 0,
            currentWining: 0,
            totalbet: 0,
            rtpSpinCount: 0,
            totalSpin: 0
        };
        this.settings = (0, helper_1.initializeGameSettings)(currentGameData, this);
        this.settings.reels = (0, helper_1.generateInitialReel)(this.settings);
        (0, helper_1.sendInitData)(this);
    }
    get initSymbols() {
        return this.currentGameData.gameSettings.Symbols;
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
        this.settings.matrix.x = data.matrixX;
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
    resultRow(matrix) {
        return matrix.map(element => {
            const symbol = this.settings.Symbols.find(sym => sym.Id === element);
            return symbol;
        });
    }
    checkResult() {
        const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
        const totalPayout = (0, helper_1.checkPayout)(preProcessedResult);
        const finalPayout = totalPayout ? parseInt(totalPayout.toString(), 10) : 0;
        if (finalPayout === 0 && preProcessedResult.some(symbol => symbol.Name === types_1.SPECIALSYMBOLS.ZERO || symbol.Name === types_1.SPECIALSYMBOLS.DOUBLEZERO)) {
            this.settings.hasreSpin = true;
            (0, helper_1.makeResultJson)(this);
            this.handleZeroRespin();
        }
        else if (finalPayout > 0 && finalPayout <= 5 && this.shouldTriggerRedRespin() && this.settings.matrix.x > 1) {
            console.log('Red Respin triggered.');
            this.handleRedRespin();
        }
        else {
            this.playerData.currentWining = finalPayout;
            (0, helper_1.makeResultJson)(this);
            console.log('SYMBOLS:', preProcessedResult);
            console.log('FINALPAY:', finalPayout);
        }
    }
    shouldTriggerRedRespin() {
        return Math.random() < 0.9;
    }
    /**
     * Handles the respin logic when a '0' or '00' symbol is present in the matrix.
     * This function processes the current matrix, triggers additional respins if necessary,
     * and updates the player's winnings based on the final payout.
     *
     * The method performs the following steps:
     * - Identifies the indices of '0' and '00' symbols and sets them as freeze indices.
     * - Stores the current result matrix as the last respin matrix.
     * - Generates a new matrix with frozen symbols.
     * - Checks the payout and matrix state to determine if another respin is needed.
     * - Stops respinning if the payout is greater than zero or the matrix remains unchanged.
     *
     */
    handleZeroRespin() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Zero Respin triggered due to 0 or 00 in the matrix.');
                const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
                this.settings.freezeIndex = preProcessedResult
                    .map((symbol, index) => (symbol.Name === types_1.SPECIALSYMBOLS.ZERO || symbol.Name === types_1.SPECIALSYMBOLS.DOUBLEZERO) ? index : null)
                    .filter(index => index !== null);
                this.settings.lastReSpin = this.settings.resultSymbolMatrix[0].slice();
                yield new RandomResultGenerator_1.RandomResultGenerator(this);
                let newMatrix = this.settings.resultSymbolMatrix[0];
                this.settings.resultSymbolMatrix[0] = (0, helper_1.freezeIndex)(this, types_1.SPINTYPES.RESPIN, newMatrix);
                console.log('New Matrix after Zero Respin: ', this.settings.resultSymbolMatrix[0]);
                const updatedPreProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
                const newTotalPayout = (0, helper_1.checkPayout)(updatedPreProcessedResult);
                const matricesAreSame = (0, helper_1.checkSameMatrix)(this.settings.lastReSpin, this.settings.resultSymbolMatrix[0]);
                if (newTotalPayout === 0 && !matricesAreSame && updatedPreProcessedResult.some(symbol => symbol.Name === types_1.SPECIALSYMBOLS.ZERO || symbol.Name === types_1.SPECIALSYMBOLS.DOUBLEZERO)) {
                    console.log('Payout is still zero, and 0 or 00 is present. Triggering another respin.');
                    yield this.handleZeroRespin();
                }
                else if (matricesAreSame || newTotalPayout > 0) {
                    console.log('Zero Respin stopped as matrix is the same or payout is greater than zero.');
                    console.log('Final Payout:', newTotalPayout);
                    this.playerData.currentWining = newTotalPayout;
                    this.settings.hasreSpin = false;
                    yield this.updatePlayerBalance(newTotalPayout);
                    (0, helper_1.makeResultJson)(this);
                    return;
                }
                this.settings.freezeIndex = [];
                return;
            }
            catch (error) {
                console.error(`ERROR ${error} WHILE CHECKING FOR ${types_1.SPINTYPES.RESPIN}`);
                return;
            }
        });
    }
    /**
     * Handles the respin logic when the payout is greater than 0 and less than or equal to 5.
     * This function processes the current matrix, triggers additional respins if necessary,
     * and updates the player's winnings based on the final payout.
     *
     * The method performs the following steps:
     * - Identifies the indices of symbols that meet specific criteria (e.g., '1', '2', '5') and sets them as freeze indices.
     * - Stores the current result matrix as the initial red respin matrix if not already set.
     * - Generates a new matrix with frozen symbols.
     * - Checks the payout and matrix state to determine if another red respin is needed.
     * - Stops respinning if the payout exceeds 5 or the matrix changes.
     *
     */
    handleRedRespin() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Red Respin triggered due to payout being > 0 and <= 5.');
                const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
                this.settings.freezeIndex = preProcessedResult
                    .map((symbol, index) => (symbol.Name === types_1.SPECIALSYMBOLS.ONE || symbol.Name === types_1.SPECIALSYMBOLS.TWO || symbol.Name === types_1.SPECIALSYMBOLS.FIVE) ? index : null)
                    .filter(index => index !== null);
                if (!this.settings.initialRedRespinMatrix) {
                    this.settings.initialRedRespinMatrix = this.settings.resultSymbolMatrix[0].slice();
                }
                yield new RandomResultGenerator_1.RandomResultGenerator(this);
                let newMatrix = this.settings.resultSymbolMatrix[0];
                this.settings.resultSymbolMatrix[0] = (0, helper_1.freezeIndex)(this, types_1.SPINTYPES.REDRESPIN, newMatrix);
                console.log('New Matrix after Red Respin:', this.settings.resultSymbolMatrix[0]);
                const updatedPreProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
                const newTotalPayout = (0, helper_1.checkPayout)(updatedPreProcessedResult);
                console.log('Payout after Red Respin:', newTotalPayout);
                if (newTotalPayout <= 5) {
                    console.log('Payout is still <= 5. Triggering another red respin.');
                    yield this.handleRedRespin();
                }
                else {
                    console.log('Red Respin stopped. Final Payout:', newTotalPayout);
                    this.playerData.currentWining = newTotalPayout;
                    this.settings.initialRedRespinMatrix = null;
                    return;
                }
            }
            catch (error) {
                console.error(`ERROR ${error} WHILE CHECKING FOR ${types_1.SPINTYPES.REDRESPIN}`);
                return;
            }
        });
    }
}
exports.SLCM = SLCM;
