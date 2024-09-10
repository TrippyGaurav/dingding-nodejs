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
    /**
     * Initializes a new instance of the SLCM class.
     * @param currentGameData - The data related to the current game.
     */
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
    /**
     * Retrieves the initial symbols for the game.
     * @returns An array of symbols used in the game.
     */
    get initSymbols() {
        return this.currentGameData.gameSettings.Symbols;
    }
    /**
     * Sends a message with a specific action and data.
     * @param action - The action type for the message.
     * @param message - The data to be sent with the message.
     */
    sendMessage(action, message) {
        this.currentGameData.sendMessage(action, message);
    }
    /**
     * Sends an error message.
     * @param message - The error message to be sent.
     */
    sendError(message) {
        this.currentGameData.sendError(message);
    }
    /**
     * Sends an alert message.
     * @param message - The alert message to be sent.
     */
    sendAlert(message) {
        this.currentGameData.sendAlert(message);
    }
    /**
     * Updates the player's balance by a specified amount.
     * @param amount - The amount to be added to the player's balance.
     */
    updatePlayerBalance(amount) {
        this.currentGameData.updatePlayerBalance(amount);
    }
    /**
     * Deducts a specified amount from the player's balance.
     * @param amount - The amount to be deducted from the player's balance.
     */
    deductPlayerBalance(amount) {
        this.currentGameData.deductPlayerBalance(amount);
    }
    /**
     * Retrieves the current player data.
     * @returns The player data object.
     */
    getPlayerData() {
        return this.currentGameData.getPlayerData();
    }
    /**
     * Handles incoming messages and performs actions based on the message id.
     * @param response - The message response containing id and data.
     */
    messageHandler(response) {
        switch (response.id) {
            case "SPIN":
                this.prepareSpin(response.data);
                this.spinResult();
                break;
        }
    }
    /**
     * Prepares the game settings for a new spin based on provided data.
     * @param data - The data related to the spin configuration.
     */
    prepareSpin(data) {
        this.settings.matrix.x = data.matrixX;
        this.settings.currentLines = data.currentLines;
        this.settings.BetPerLines = this.settings.currentGamedata.bets[data.currentBet];
        this.settings.currentBet = this.settings.BetPerLines * this.settings.currentLines;
    }
    /**
     * Executes the spin operation, deducts the player's balance, and generates spin results.
     * Handles errors and logs them if the spin fails.
     */
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
    /**
     * Checks the result of the spin, handles respins, and calculates payouts.
     * Updates game settings and triggers additional respin checks if needed.
     */
    resultRow(matrix) {
        return matrix.map(element => {
            const symbol = this.settings.Symbols.find(sym => sym.Id === element);
            return symbol;
        });
    }
    checkPayout(preProcessedResult) {
        let payoutString = '';
        preProcessedResult.forEach(symbol => {
            if ((symbol === null || symbol === void 0 ? void 0 : symbol.Name) !== undefined) {
                if (symbol.payout && symbol.Name !== '00') {
                    payoutString += symbol.payout.toString();
                }
                if (symbol.Name === 'doubleZero') {
                    payoutString;
                }
            }
        });
        // Convert the payout string to an integer value
        const totalPayout = payoutString ? parseInt(payoutString, 10) : 0;
        return totalPayout;
    }
    newMatrix(matrix, type) {
        const { lastReSpin, freezeIndex } = this.settings;
        const { RedFreezeIndex } = this.settings.hasRedrespin;
        return matrix.map((item, index) => {
            var _a, _b, _c, _d, _e, _f;
            if (type === 'reSpin') {
                if (freezeIndex.includes(index)) {
                    return (_c = (_b = (_a = lastReSpin[index]) === null || _a === void 0 ? void 0 : _a.Symbol) === null || _b === void 0 ? void 0 : _b.Id) !== null && _c !== void 0 ? _c : lastReSpin[index];
                }
                return item;
            }
            else if (type === 'redReSpin') {
                if (RedFreezeIndex.includes(index)) {
                    return (_f = (_e = (_d = lastReSpin[index]) === null || _d === void 0 ? void 0 : _d.Symbol) === null || _e === void 0 ? void 0 : _e.Id) !== null && _f !== void 0 ? _f : lastReSpin[index];
                }
                return item;
            }
        });
    }
    checkSameMatrix(matrix) {
        const { lastReSpin } = this.settings;
        return lastReSpin.every((item, index) => {
            return JSON.stringify(item) === JSON.stringify(matrix[index]);
        });
    }
    //
    checkResult() {
        const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
        const shouldRedRespin = (0, helper_1.hasRedspinPattern)(preProcessedResult);
        const shouldRespin = (0, helper_1.hasRespinPattern)(preProcessedResult);
        // Calculate the payout
        const totalPayout = this.checkPayout(preProcessedResult);
        const finalPayout = totalPayout ? parseInt(totalPayout.toString(), 10) : 0;
        this.playerData.currentWining = finalPayout;
        // If we have a respin pattern and payout is zero, initiate a respin
        if (shouldRespin && finalPayout === 0 && !this.settings.hasRedrespin.state) {
            (0, helper_1.initiateRespin)(this, preProcessedResult);
        }
        else if (finalPayout <= 5 && shouldRedRespin && !this.settings.hasRespin) {
            // Initiate red respin if applicable
            this.settings.hasRedrespin.initialpay = this.playerData.currentWining;
            (0, helper_1.initiateRedRespin)(this, preProcessedResult);
        }
        // Check for active Respin
        if (this.settings.hasRespin) {
            let newMatrix = this.newMatrix(this.settings.resultSymbolMatrix[0], 'reSpin');
            console.log(newMatrix, 'New Matrix after Replacement');
            const allValuesSame = this.checkSameMatrix(newMatrix);
            // Stop the respin if the matrix remains the same
            if (allValuesSame) {
                console.log('RESPIN: All values are the same. Respin stopped.');
                this.settings.hasRespin = false;
                this.settings.freezeIndex = [];
                return;
            }
            else {
                this.settings.resultSymbolMatrix[0] = newMatrix;
                this.settings.freezeIndex = [];
                this.settings.hasRespin = false;
                const preProcessedResult = this.resultRow(newMatrix);
                // Check if respin pattern exists in the new matrix
                const shouldRespin = (0, helper_1.hasRespinPattern)(preProcessedResult);
                if (shouldRespin && this.playerData.currentWining === 0) {
                    this.settings.hasRedrespin.state = false;
                    console.log('RESPIN: Respin pattern found, initiating respin');
                    (0, helper_1.initiateRespin)(this, preProcessedResult);
                }
                else {
                    console.log('RESPIN: No respin pattern found, continuing normally.');
                }
            }
        }
        // Check for active Red Respin
        if (this.settings.hasRedrespin.state) {
            this.settings.hasRespin = false;
            let newMatrix = this.newMatrix(this.settings.resultSymbolMatrix[0], 'redReSpin');
            console.log(newMatrix, 'New Matrix after Replacement (Red Respin)');
            const allValuesSame = this.checkSameMatrix(newMatrix);
            const preProcessedResult = this.resultRow(newMatrix);
            if (allValuesSame) {
                // If the matrix is the same in red respin, trigger another red respin
                console.log('RED RESPIN: Matrix is the same, initiating another red respin');
                (0, helper_1.initiateRedRespin)(this, preProcessedResult);
            }
            else {
                this.settings.resultSymbolMatrix[0] = newMatrix;
                const totalPayout = this.checkPayout(newMatrix);
                this.playerData.currentWining = totalPayout;
                // If payout is more than 5, stop the red respin
                console.log(`RED RESPIN: Payout is greater than ${this.settings.hasRedrespin.initialpay} , stopping red respin ${this.playerData.currentWining}`);
                if (this.playerData.currentWining > this.settings.hasRedrespin.initialpay) {
                    console.log(`RED RESPIN: Payout is greater than ${this.settings.hasRedrespin.initialpay} , stopping red respin`);
                    this.settings.hasRedrespin.state = false;
                    this.settings.hasRedrespin.RedFreezeIndex = [];
                    return;
                }
                else {
                    // Otherwise, continue with the red respin
                    console.log('RED RESPIN: Payout is not sufficient, continuing red respin');
                    (0, helper_1.initiateRedRespin)(this, preProcessedResult);
                }
            }
        }
        this.playerData.currentWining = finalPayout;
        console.log('SYMBOLS:', preProcessedResult);
        console.log('FINALPAY:', finalPayout);
    }
}
exports.SLCM = SLCM;
