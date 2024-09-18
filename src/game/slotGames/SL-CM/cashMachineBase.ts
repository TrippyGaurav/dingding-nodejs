import { RandomResultGenerator } from "../RandomResultGenerator";
import { CMSettings, SPECIALSYMBOLS, SPINTYPES } from "./types";
import { initializeGameSettings, generateInitialReel, sendInitData, freezeIndex, checkSameMatrix, checkPayout, makeResultJson } from "./helper";
import { currentGamedata } from "../../../Player";
import { resultRow } from "./helper";
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
                this.getRTP(response.data.spins);
                break;
        }
    }

    private prepareSpin(data: any) {
        this.settings.matrix.x = data.matrixX;
        this.settings.currentBet = this.settings.currentGamedata.bets[data.currentBet];

    }

    public async spinResult(): Promise<void> {
        try {
            const playerData = this.getPlayerData();
            if (this.settings.currentBet > playerData.credits) {
                this.sendError("Low Balance");
                return;
            } else if (!this.settings.hasreSpin && !this.settings.hasredSpin) {
                await this.deductPlayerBalance(this.settings.currentBet);
            }
            this.playerData.totalbet += this.settings.currentBet;
            await new RandomResultGenerator(this);
            await this.checkResult();
        } catch (error) {
            this.sendError("Spin error");
            console.error("Failed to generate spin results:", error);
        }
    }





    private async getRTP(spins: number): Promise<void> {
        try {
            let spend: number = 0;
            let won: number = 0;
            this.playerData.rtpSpinCount = spins;

            for (let i = 0; i < this.playerData.rtpSpinCount; i++) {
                await this.spinResult();
                spend = this.playerData.totalbet;
                won = this.playerData.haveWon;
                console.log(`Spin ${i + 1} completed. ${this.playerData.totalbet} , ${won}`);
            }
            let rtp = 0;
            if (spend > 0) {
                rtp = won / spend;
            }
            console.log('RTP calculated:', rtp * 100);

            return;
        } catch (error) {
            console.error("Failed to calculate RTP:", error);
            this.sendError("RTP calculation error");
        }
    }

    /**
     * Checks the result of the current spin and processes based on the result.
     * 
     * This method performs the following tasks:
     * 1. Pre-processes the result matrix by mapping the symbols in the matrix to their corresponding symbol objects.
     * 2. Calculates the total payout based on the pre-processed result and parses it to an integer.
     * 3. If the final payout is 0 and the result contains special symbols (ZERO or DOUBLEZERO), a re-spin is triggered:
     *    - Marks `hasreSpin` as true and pushes the current result to `specialSpins`.
     *    - Calls the method `handleZeroRespin()` to process the re-spin.
     * 4. If the final payout is greater than 0 but less than or equal to 5, and a red re-spin should be triggered:
     *    - Marks `hasredSpin` as true and pushes the current result to `specialSpins`.
     *    - Calls `handleRedRespin()` to process the red re-spin.
     * 5. If no re-spin or red re-spin is triggered:
     *    - Updates the player's current winnings and updates their balance.
     *    - Creates a result JSON for further processing or storage.
     *    - Logs the pre-processed symbols and final payout to the console for debugging.
     * 
     * @private
     * @async
     */
    private async checkResult() {
        const preProcessedResult = resultRow(this, this.settings.resultSymbolMatrix[0]);
        const totalPayout = checkPayout(preProcessedResult);
        const finalPayout = totalPayout ? parseInt(totalPayout.toString(), 10) : 0;

        // Check for ZERO or DOUBLEZERO symbols and trigger a regular re-spin if payout is 0
        if (finalPayout === 0 && preProcessedResult.some(symbol => symbol.Name === SPECIALSYMBOLS.ZERO || symbol.Name === SPECIALSYMBOLS.DOUBLEZERO)) {
            this.settings.hasreSpin = true;
            this.settings.specialSpins.push(this.settings.resultSymbolMatrix[0]);
            this.handleZeroRespin();
        }
        // Check for conditions to trigger a red re-spin if payout is small
        else if (finalPayout > 0 && finalPayout <= 5 && this.shouldTriggerRedRespin() && this.settings.matrix.x > 1) {
            console.log('Red Respin triggered.');
            this.settings.specialSpins.push(this.settings.resultSymbolMatrix[0]);
            this.settings.hasredSpin = true;
            this.handleRedRespin();
        }
        // Update player's winnings if no re-spin is needed
        else {
            this.playerData.currentWining = finalPayout;
            this.playerData.haveWon += this.playerData.currentWining
            await this.updatePlayerBalance(this.playerData.currentWining);
            makeResultJson(this);
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
            const preProcessedResult = resultRow(this, this.settings.resultSymbolMatrix[0]);
            this.settings.freezeIndex = preProcessedResult
                .map((symbol, index) => (symbol.Name === SPECIALSYMBOLS.ZERO || symbol.Name === SPECIALSYMBOLS.DOUBLEZERO) ? index : null)
                .filter(index => index !== null);
            this.settings.lastReSpin = this.settings.resultSymbolMatrix[0].slice();
            await new RandomResultGenerator(this);

            let newMatrix = this.settings.resultSymbolMatrix[0];
            this.settings.resultSymbolMatrix[0] = freezeIndex(this, SPINTYPES.RESPIN, newMatrix);

            console.log('New Matrix after Zero Respin: ', this.settings.resultSymbolMatrix[0]);
            const updatedPreProcessedResult = resultRow(this, this.settings.resultSymbolMatrix[0]);
            const newTotalPayout = checkPayout(updatedPreProcessedResult);
            const matricesAreSame = checkSameMatrix(this.settings.lastReSpin, this.settings.resultSymbolMatrix[0]);

            if (newTotalPayout === 0 && !matricesAreSame && updatedPreProcessedResult.some(symbol => symbol.Name === SPECIALSYMBOLS.ZERO || symbol.Name === SPECIALSYMBOLS.DOUBLEZERO)) {
                console.log('Payout is still zero, and 0 or 00 is present. Triggering another respin.');
                this.settings.specialSpins.push(this.settings.resultSymbolMatrix[0])

                await this.handleZeroRespin();
            } else if (matricesAreSame || newTotalPayout > 0) {
                console.log('Zero Respin stopped as matrix is the same or payout is greater than zero.');
                console.log('Final Payout:', newTotalPayout);
                this.settings.specialSpins.push(this.settings.resultSymbolMatrix[0]);
                console.log(this.settings.specialSpins, 'this.settings.reSpinReels')
                this.settings.resultSymbolMatrix = this.settings.specialSpins
                this.playerData.currentWining = newTotalPayout;
                this.playerData.haveWon += this.playerData.currentWining
                await this.updatePlayerBalance(this.playerData.currentWining)
                makeResultJson(this);
                this.settings.hasreSpin = false
                this.settings.specialSpins = [];
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

            const preProcessedResult = resultRow(this, this.settings.resultSymbolMatrix[0]);

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

            const updatedPreProcessedResult = resultRow(this, this.settings.resultSymbolMatrix[0]);

            const newTotalPayout = checkPayout(updatedPreProcessedResult);
            console.log('Payout after Red Respin:', newTotalPayout);

            if (newTotalPayout <= 5) {
                console.log('Payout is still <= 5. Triggering another red respin.');
                await this.handleRedRespin();
            } else {
                console.log('Red Respin stopped. Final Payout:', newTotalPayout);
                this.settings.specialSpins.push(this.settings.resultSymbolMatrix[0]);
                console.log(this.settings.specialSpins, 'this.settings.reSpinReels')
                this.settings.resultSymbolMatrix = this.settings.specialSpins
                this.playerData.currentWining = newTotalPayout;
                this.playerData.haveWon += this.playerData.currentWining
                this.settings.initialRedRespinMatrix = null;
                await this.updatePlayerBalance(this.playerData.currentWining)
                makeResultJson(this);
                this.settings.hasredSpin = false
                this.settings.specialSpins = [];
                return;
            }
        } catch (error) {
            console.error(`ERROR ${error} WHILE CHECKING FOR ${SPINTYPES.REDRESPIN}`);
            return;
        }
    }


}