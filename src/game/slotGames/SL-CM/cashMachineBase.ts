import { WinData } from "../BaseSlotGame/WinData";
import { RandomResultGenerator } from "../RandomResultGenerator";
import { CMSettings, SPECIALSYMBOLS, SPINTYPES } from "./types";
import { initializeGameSettings, generateInitialReel, sendInitData, freezeIndex, checkSameMatrix, checkPayout, makeResultJson } from "./helper";
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
        totalSpin: 0
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




    private checkResult() {
        const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
        const totalPayout = checkPayout(preProcessedResult);
        const finalPayout = totalPayout ? parseInt(totalPayout.toString(), 10) : 0;


        if (finalPayout === 0 && preProcessedResult.some(symbol => symbol.Name === SPECIALSYMBOLS.ZERO || symbol.Name === SPECIALSYMBOLS.DOUBLEZERO)) {
            this.settings.hasreSpin = true
            this.handleZeroRespin();


        }
        else if (finalPayout > 0 && finalPayout <= 5 && this.shouldTriggerRedRespin() && this.settings.matrix.x > 1) {
            console.log('Red Respin triggered.');
            this.handleRedRespin();
        } else {
            this.playerData.currentWining = finalPayout;
            makeResultJson(this)
            console.log('SYMBOLS:', preProcessedResult);
            console.log('FINALPAY:', finalPayout);
        }
    }
    private shouldTriggerRedRespin(): boolean {
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

    private async handleZeroRespin() {
        try {
            console.log('Zero Respin triggered due to 0 or 00 in the matrix.');
            const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
            this.settings.freezeIndex = preProcessedResult
                .map((symbol, index) => (symbol.Name === SPECIALSYMBOLS.ZERO || symbol.Name === SPECIALSYMBOLS.DOUBLEZERO) ? index : null)
                .filter(index => index !== null);
            this.settings.lastReSpin = this.settings.resultSymbolMatrix[0].slice();
            await new RandomResultGenerator(this);

            let newMatrix = this.settings.resultSymbolMatrix[0];
            this.settings.resultSymbolMatrix[0] = freezeIndex(this, SPINTYPES.RESPIN, newMatrix);
    
            console.log('New Matrix after Zero Respin: ', this.settings.resultSymbolMatrix[0]);
            const updatedPreProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);
            const newTotalPayout = checkPayout(updatedPreProcessedResult);
            const matricesAreSame = checkSameMatrix(this.settings.lastReSpin, this.settings.resultSymbolMatrix[0]);

            if (newTotalPayout === 0 && !matricesAreSame && updatedPreProcessedResult.some(symbol => symbol.Name === SPECIALSYMBOLS.ZERO || symbol.Name === SPECIALSYMBOLS.DOUBLEZERO)) {
                console.log('Payout is still zero, and 0 or 00 is present. Triggering another respin.');
                await this.handleZeroRespin();
            } else if (matricesAreSame || newTotalPayout > 0) {
                console.log('Zero Respin stopped as matrix is the same or payout is greater than zero.');
                console.log('Final Payout:', newTotalPayout);
                this.settings.resultSymbolMatrix.push(this.settings.resultSymbolMatrix[0])
                this.playerData.currentWining = newTotalPayout;
                makeResultJson(this);
                this.settings.hasreSpin = false
                this.settings.reSpinReels = []
                return
            }

            this.settings.freezeIndex = [];
            return;
        } catch (error) {
            console.error(`ERROR ${error} WHILE CHECKING FOR ${SPINTYPES.RESPIN}`);
            return;
        }
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

    private async handleRedRespin() {
        try {
            console.log('Red Respin triggered due to payout being > 0 and <= 5.');

            const preProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);

            this.settings.freezeIndex = preProcessedResult
                .map((symbol, index) => (symbol.Name === SPECIALSYMBOLS.ONE || symbol.Name === SPECIALSYMBOLS.TWO || symbol.Name === SPECIALSYMBOLS.FIVE) ? index : null)
                .filter(index => index !== null);

            if (!this.settings.initialRedRespinMatrix) {
                this.settings.initialRedRespinMatrix = this.settings.resultSymbolMatrix[0].slice();
            }

            await new RandomResultGenerator(this);
            let newMatrix = this.settings.resultSymbolMatrix[0];
            this.settings.resultSymbolMatrix[0] = freezeIndex(this, SPINTYPES.REDRESPIN, newMatrix);
            console.log('New Matrix after Red Respin:', this.settings.resultSymbolMatrix[0]);

            const updatedPreProcessedResult = this.resultRow(this.settings.resultSymbolMatrix[0]);

            const newTotalPayout = checkPayout(updatedPreProcessedResult);
            console.log('Payout after Red Respin:', newTotalPayout);

            if (newTotalPayout <= 5) {
                console.log('Payout is still <= 5. Triggering another red respin.');
                await this.handleRedRespin();
            } else {
                console.log('Red Respin stopped. Final Payout:', newTotalPayout);
                this.playerData.currentWining = newTotalPayout;
                this.settings.initialRedRespinMatrix = null;
                return;
            }
        } catch (error) {
            console.error(`ERROR ${error} WHILE CHECKING FOR ${SPINTYPES.REDRESPIN}`);
            return;
        }
    }


}