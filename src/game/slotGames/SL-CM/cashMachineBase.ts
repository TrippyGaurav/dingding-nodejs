import { WinData } from "../BaseSlotGame/WinData";
import { RandomResultGenerator } from "../RandomResultGenerator";
import { CMSettings, SPINTYPES } from "./types";
import { initializeGameSettings, generateInitialReel, sendInitData, freezeIndex } from "./helper";
import { currentGamedata } from "../../../Player";

/**
 * Represents the Slot Machine Game Class for handling slot machine operations.
 */
export class SLCM {
    public settings: CMSettings;
    playerData = {
        haveWon: 0,
        currentWining: 0,
        totalbet: 0,
        rtpSpinCount: 0,
        totalSpin: 0,
        currentPayout: 0
    };

    constructor(public currentGameData: currentGamedata) {
        this.settings = initializeGameSettings(currentGameData, this);
        this.settings.reels = generateInitialReel(this.settings);
        sendInitData(this);
    }

    get initSymbols() {
        return this.currentGameData.gameSettings.Symbols;
    }

    sendMessage(action: string, message: any) {
        this.currentGameData.sendMessage(action, message);
    }

    sendError(message: string) {
        this.currentGameData.sendError(message);
    }

    sendAlert(message: string) {
        this.currentGameData.sendAlert(message);
    }

    updatePlayerBalance(amount: number) {
        this.currentGameData.updatePlayerBalance(amount);
    }

    deductPlayerBalance(amount: number) {
        this.currentGameData.deductPlayerBalance(amount);
    }

    getPlayerData() {
        return this.currentGameData.getPlayerData();
    }

    messageHandler(response: any) {
        switch (response.id) {
            case "SPIN":
                this.prepareSpin(response.data);
                this.spinResult();
                break;
        }
    }

    private prepareSpin(data: any) {
        this.settings.matrix.x = data.matrixX;
        this.settings.currentLines = data.currentLines;
        this.settings.BetPerLines = this.settings.currentGamedata.bets[data.currentBet];
        this.settings.currentBet = this.settings.BetPerLines * this.settings.currentLines;
    }

    public async spinResult() {
        try {
            const playerData = this.getPlayerData();
            if (this.settings.currentBet > playerData.credits) {
                this.sendError("Low Balance");
                return;
            }
            await this.deductPlayerBalance(this.settings.currentBet);
            this.playerData.totalbet += this.settings.currentBet;
            new RandomResultGenerator(this);
            this.checkResult();
        } catch (error) {
            this.sendError("Spin error");
            console.error("Failed to generate spin results:", error);
        }
    }

    private resultRow(matrix: any[]): any[] {
        return matrix.map(element => {
            const symbol = this.settings.Symbols.find(sym => sym.Id === element);
            return symbol;
        });
    }

    private checkPayout(preProcessedResult: any[]): number {
        let payoutString = '';
        preProcessedResult.forEach(symbol => {
            if (symbol?.Name !== undefined && symbol.payout && symbol.Name !== '00') {
                payoutString += symbol.payout.toString();
            }
        });

        const totalPayout = payoutString ? parseInt(payoutString, 10) : 0;
        return totalPayout;
    }

    private newMatrix(matrix: any[]): any[] {
        return matrix.map((item, index) => {
            if (this.settings.freezeIndex.includes(index)) {
                return this.settings.lastReSpin[index];
            }
            return item;
        });
    }

    private checkSameMatrix(matrix1: any[], matrix2: any[]): boolean {
        return matrix1.every((item, index) => {
            return JSON.stringify(item) === JSON.stringify(matrix2[index]);
        });
    }
    private checkResult() {
        const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);

        const totalPayout = this.checkPayout(preProcessedResult);
        const finalPayout = totalPayout ? parseInt(totalPayout.toString(), 10) : 0;

        if (finalPayout === 0 && preProcessedResult.some(symbol => symbol.Name === '0' || symbol.Name === 'doubleZero')) {
            this.handleZeroRespin();
        }
        else if (finalPayout > 0 && finalPayout <= 5 && this.shouldTriggerRedRespin()) {
            console.log('Red Respin triggered.');
            this.handleRedRespin();
        } else {
            this.playerData.currentWining = finalPayout;
            console.log('SYMBOLS:', preProcessedResult);
            console.log('FINALPAY:', finalPayout);
        }
    }
    private shouldTriggerRedRespin(): boolean {
        return Math.random() < 0.9;
    }
    private handleZeroRespin() {
        console.log('Zero Respin triggered due to 0 or 00 in the matrix.');

        const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);

        this.settings.freezeIndex = preProcessedResult
            .map((symbol, index) => (symbol.Name === '0' || symbol.Name === 'doubleZero') ? index : null)
            .filter(index => index !== null);

        this.settings.lastReSpin = this.settings.resultSymbolMatrix[0].slice();

        new RandomResultGenerator(this);
        let newMatrix = this.settings.resultSymbolMatrix[0];

        this.settings.resultSymbolMatrix[0] = freezeIndex(this, SPINTYPES.RESPIN, newMatrix)



        console.log('New Matrix after Zero Respin: ', this.settings.resultSymbolMatrix[0]);

        const updatedPreProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);

        const newTotalPayout = this.checkPayout(updatedPreProcessedResult);
        const newFinalPayout = newTotalPayout ? parseInt(newTotalPayout.toString(), 10) : 0;

        const matricesAreSame = this.checkSameMatrix(this.settings.lastReSpin, this.settings.resultSymbolMatrix[0]);

        if (newFinalPayout === 0 && !matricesAreSame && updatedPreProcessedResult.some(symbol => symbol.Name === '0' || symbol.Name === 'doubleZero')) {
            console.log('Payout is still zero, and 0 or 00 is present. Triggering another respin.');
            this.handleZeroRespin();
        } else if (matricesAreSame || newFinalPayout > 0) {
            console.log('Zero Respin stopped as matrix is the same or payout is greater than zero.');
            console.log('Final Payout:', newFinalPayout);
            this.playerData.currentWining = newFinalPayout;
        }
        this.settings.freezeIndex = [];
        return;
    }
    private handleRedRespin() {
        console.log('Red Respin triggered due to payout being > 0 and <= 5.');

        const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);

        this.settings.freezeIndex = preProcessedResult
            .map((symbol, index) => (symbol.Name === '1' || symbol.Name === '2' || symbol.Name === '5') ? index : null)
            .filter(index => index !== null);

        if (!this.settings.initialRedRespinMatrix) {
            this.settings.initialRedRespinMatrix = this.settings.resultSymbolMatrix[0].slice();
        }

        new RandomResultGenerator(this);
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