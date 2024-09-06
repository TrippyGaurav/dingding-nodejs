import { WinData } from "../BaseSlotGame/WinData";
import { RandomResultGenerator } from "../RandomResultGenerator";
import { CMSettings } from "./types";
import { initializeGameSettings, generateInitialReel, sendInitData, hasRespinPattern, initiateRedRespin, initiateRespin } from "./helper";
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

  /**
   * Initializes a new instance of the SLCM class.
   * @param currentGameData - The data related to the current game.
   */
  constructor(public currentGameData: currentGamedata) {
    this.settings = initializeGameSettings(currentGameData, this);
    this.settings.reels = generateInitialReel(this.settings);
    sendInitData(this);
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
  sendMessage(action: string, message: any) {
    this.currentGameData.sendMessage(action, message);
  }

  /**
   * Sends an error message.
   * @param message - The error message to be sent.
   */
  sendError(message: string) {
    this.currentGameData.sendError(message);
  }

  /**
   * Sends an alert message.
   * @param message - The alert message to be sent.
   */
  sendAlert(message: string) {
    this.currentGameData.sendAlert(message);
  }

  /**
   * Updates the player's balance by a specified amount.
   * @param amount - The amount to be added to the player's balance.
   */
  updatePlayerBalance(amount: number) {
    this.currentGameData.updatePlayerBalance(amount);
  }

  /**
   * Deducts a specified amount from the player's balance.
   * @param amount - The amount to be deducted from the player's balance.
   */
  deductPlayerBalance(amount: number) {
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
  messageHandler(response: any) {
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
  private prepareSpin(data: any) {
    this.settings.matrix.x = 3;
    this.settings.currentLines = data.currentLines;
    this.settings.BetPerLines = this.settings.currentGamedata.bets[data.currentBet];
    this.settings.currentBet = this.settings.BetPerLines * this.settings.currentLines;
  }

  /**
   * Executes the spin operation, deducts the player's balance, and generates spin results.
   * Handles errors and logs them if the spin fails.
   */
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

  /**
   * Checks the result of the spin, handles respins, and calculates payouts.
   * Updates game settings and triggers additional respin checks if needed.
   */
  private checkResult() {
    if (this.settings.freezeIndex.length > 0 && (this.settings.hasRespin || this.settings.hasRedrespin.state)) {
      const currentArr = this.settings.lastReSpin;
      const freezeIndex = this.settings.freezeIndex;
      console.log(freezeIndex, 'Freeze Indexes');
      console.log(currentArr, 'Previous Array');
      let newMatrix = this.settings.resultSymbolMatrix[0].map((item, index) => {
        if (freezeIndex.includes(index)) {
          return currentArr[index]?.Symbol?.Id ?? currentArr[index];
        }
        return item;
      });

      console.log(newMatrix, 'New Matrix after Replacement');
      if (this.settings.hasRespin) {
        const allValuesSame = currentArr.every((item, index) => {
          return JSON.stringify(item) === JSON.stringify(newMatrix[index]);
        });

        if (allValuesSame) {
          console.log('All values are the same. Respin stopped.');
          this.settings.hasRespin = false;
          this.settings.freezeIndex = [];
          return;
        } else {
          this.settings.resultSymbolMatrix[0] = newMatrix;
          this.settings.freezeIndex = [];
          this.settings.hasRespin = false;

          const shouldRespin = hasRespinPattern(newMatrix);

          if (shouldRespin) {
            console.log('respin pattern found');
            initiateRespin(this, newMatrix);

          } else {
            console.log('No respin pattern found, continuing normally.');
          }
        }
      } else if (this.settings.hasRedrespin.state) {
        this.settings.resultSymbolMatrix[0] = newMatrix;
        // Handling red respin condition
        if (this.playerData.currentWining > this.settings.hasRedrespin.initialpay) {
          this.settings.hasRedrespin.state = false;
          this.settings.freezeIndex = [];

          if (this.playerData.currentWining > 5) {
            return
          }
        }
      }
    }

    const resultRow = this.settings.resultSymbolMatrix[0];
    const preProcessedResult = resultRow.map(element => {
      const symbol = this.settings.Symbols.find(sym => sym.Id === element);
      return symbol;
    });
    hasRespinPattern(preProcessedResult);
    const shouldRespin = hasRespinPattern(preProcessedResult);
    this.settings.resultSymbolMatrix = preProcessedResult;
    const totalPayout = preProcessedResult
      .reduce((acc, symbol) => {
        if (symbol.Name !== undefined) {
          const newPayout = acc + symbol.payout;
          return newPayout;
        }
        return acc;
      }, '')
      .trim();

    const finalPayout = totalPayout ? parseInt(totalPayout, 10) : 0;
    this.playerData.currentWining = finalPayout;

    if (shouldRespin && finalPayout === 0) {
      initiateRespin(this, this.settings.resultSymbolMatrix);
    }
    if (finalPayout > 0 && finalPayout <= 5) {
      this.settings.hasRedrespin.initialpay = finalPayout;
      const Redspinprob = Math.random();
      if (Redspinprob >= 0.1) {
        initiateRedRespin(this, this.settings.resultSymbolMatrix);
      }
    }
    console.log('SYMBOLS:', this.settings.resultSymbolMatrix);
    console.log('FINALPAY:', finalPayout);
  }

}
