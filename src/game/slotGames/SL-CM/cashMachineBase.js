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
            totalSpin: 0,
            currentPayout: 0
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
    checkPayout(preProcessedResult) {
        let payoutString = '';
        preProcessedResult.forEach(symbol => {
            if ((symbol === null || symbol === void 0 ? void 0 : symbol.Name) !== undefined && symbol.payout && symbol.Name !== '00') {
                payoutString += symbol.payout.toString();
            }
        });
        const totalPayout = payoutString ? parseInt(payoutString, 10) : 0;
        return totalPayout;
    }
    newMatrix(matrix) {
        return matrix.map((item, index) => {
            if (this.settings.freezeIndex.includes(index)) {
                return this.settings.lastReSpin[index];
            }
            return item;
        });
    }
    checkSameMatrix(matrix1, matrix2) {
        return matrix1.every((item, index) => {
            return JSON.stringify(item) === JSON.stringify(matrix2[index]);
        });
    }
    checkResult() {
        const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
        const totalPayout = this.checkPayout(preProcessedResult);
        const finalPayout = totalPayout ? parseInt(totalPayout.toString(), 10) : 0;
        if (finalPayout === 0 && preProcessedResult.some(symbol => symbol.Name === '0' || symbol.Name === 'doubleZero')) {
            this.handleZeroRespin();
        }
        else if (finalPayout > 0 && finalPayout <= 5 && this.shouldTriggerRedRespin()) {
            console.log('Red Respin triggered.');
            this.handleRedRespin();
        }
        else {
            this.playerData.currentWining = finalPayout;
            console.log('SYMBOLS:', preProcessedResult);
            console.log('FINALPAY:', finalPayout);
        }
    }
    shouldTriggerRedRespin() {
        return Math.random() < 0.9;
    }
    handleZeroRespin() {
        console.log('Zero Respin triggered due to 0 or 00 in the matrix.');
        const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
        this.settings.freezeIndex = preProcessedResult
            .map((symbol, index) => (symbol.Name === '0' || symbol.Name === 'doubleZero') ? index : null)
            .filter(index => index !== null);
        this.settings.lastReSpin = this.settings.resultSymbolMatrix[0].slice();
        new RandomResultGenerator_1.RandomResultGenerator(this);
        let newMatrix = this.settings.resultSymbolMatrix[0];
        this.settings.resultSymbolMatrix[0] = newMatrix.map((item, index) => {
            if (this.settings.freezeIndex.includes(index)) {
                return this.settings.lastReSpin[index];
            }
            return item;
        });
        console.log('New Matrix after Zero Respin: ', this.settings.resultSymbolMatrix[0]);
        const updatedPreProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
        const newTotalPayout = this.checkPayout(updatedPreProcessedResult);
        const newFinalPayout = newTotalPayout ? parseInt(newTotalPayout.toString(), 10) : 0;
        const matricesAreSame = this.checkSameMatrix(this.settings.lastReSpin, this.settings.resultSymbolMatrix[0]);
        if (newFinalPayout === 0 && !matricesAreSame && updatedPreProcessedResult.some(symbol => symbol.Name === '0' || symbol.Name === 'doubleZero')) {
            console.log('Payout is still zero, and 0 or 00 is present. Triggering another respin.');
            this.handleZeroRespin();
        }
        else if (matricesAreSame || newFinalPayout > 0) {
            console.log('Zero Respin stopped as matrix is the same or payout is greater than zero.');
            console.log('Final Payout:', newFinalPayout);
            this.playerData.currentWining = newFinalPayout;
        }
        this.settings.freezeIndex = [];
        return;
    }
    handleRedRespin() {
        console.log('Red Respin triggered due to payout being > 0 and <= 5.');
        const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
        this.settings.freezeIndex = preProcessedResult
            .map((symbol, index) => (symbol.Name === '1' || symbol.Name === '2' || symbol.Name === '5') ? index : null)
            .filter(index => index !== null);
        if (!this.settings.initialRedRespinMatrix) {
            this.settings.initialRedRespinMatrix = this.settings.resultSymbolMatrix[0].slice();
        }
        new RandomResultGenerator_1.RandomResultGenerator(this);
        let newMatrix = this.settings.resultSymbolMatrix[0];
        this.settings.resultSymbolMatrix[0] = newMatrix.map((item, index) => {
            if (this.settings.freezeIndex.includes(index)) {
                return this.settings.initialRedRespinMatrix[index];
            }
            return item;
        });
        console.log('New Matrix after Red Respin:', this.settings.resultSymbolMatrix[0]);
        const updatedPreProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
        const newTotalPayout = this.checkPayout(updatedPreProcessedResult);
        const newFinalPayout = newTotalPayout ? parseInt(newTotalPayout.toString(), 10) : 0;
        console.log('Payout after Red Respin:', newFinalPayout);
        if (newFinalPayout <= 5) {
            console.log('Payout is still <= 5. Triggering another red respin.');
            this.handleRedRespin();
        }
        else {
            console.log('Red Respin stopped. Final Payout:', newFinalPayout);
            this.playerData.currentWining = newFinalPayout;
            this.settings.initialRedRespinMatrix = null;
            return;
        }
    }
}
exports.SLCM = SLCM;
