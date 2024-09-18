import { currentGamedata } from "../../../Player";
import { RandomResultGenerator } from "../RandomResultGenerator";
import { CRZSETTINGS, WINNINGTYPE } from "./types";
import { initializeGameSettings, generateInitialReel, sendInitData, calculatePayout, applyExtraSymbolEffect, checkWinningCondition, makeResultJson } from "./helper";

export class SLCRZ {
  public settings: CRZSETTINGS;
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
    generateInitialReel(this.settings)
    sendInitData(this)
  }

  get initSymbols() {
    const Symbols = [];
    this.currentGameData.gameSettings.Symbols.forEach((Element: Symbol) => {
      Symbols.push(Element);
    });
    return Symbols;
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
    this.settings.currentLines = data.currentLines;
    this.settings.BetPerLines = this.settings.currentGamedata.bets[data.currentBet];
    this.settings.currentBet = this.settings.BetPerLines * this.settings.currentLines;
  }

  private async spinResult() {
    try {
      const playerData = this.getPlayerData();
      if (!this.settings.isFreeSpin && this.settings.currentBet > playerData.credits) {
        this.sendError("Low Balance");
        return;
      }

      if (!this.settings.isFreeSpin) {
        await this.deductPlayerBalance(this.settings.currentBet);
        this.playerData.totalbet += this.settings.currentBet;
      }
      if (this.settings.freeSpinCount === 0) {
        this.settings.isFreeSpin = false;

      }
      if (
        this.settings.isFreeSpin &&
        this.settings.freeSpinCount > 0
      ) {
        this.settings.freeSpinCount--;
        this.settings.currentBet = 0;
        console.log(
          this.settings.freeSpinCount,
          "this.settings.freeSpinCount"
        );
        this.updatePlayerBalance(this.playerData.currentWining)
        // makeResultJson(this)
      }
      new RandomResultGenerator(this);
      this.checkResult();
    } catch (error) {
      this.sendError("Spin error");
      console.error("Failed to generate spin results:", error);
    }
  }

  private async checkResult() {
    try {
      const resultmatrix = this.settings.resultSymbolMatrix;
      const checkMatrix = resultmatrix.map(row => row.slice(0, 3));
      const specialMatrix = resultmatrix.map(row => row[3]);
      console.log("Result Matrix:", resultmatrix);

      const middleRow = checkMatrix[1];
      const extrasymbol = specialMatrix[1];

      console.log("Middle row:", middleRow);
      console.log("Special element:", extrasymbol);
      console.log('freeSpins', this.settings.freeSpinCount)
      if (middleRow.includes(0)) {
        this.playerData.currentWining = 0
        makeResultJson(this)
        console.log("No win: '0' present in the middle row.");
        return
      }

      const isWinning = await checkWinningCondition(this, middleRow);

      let payout = 0;

      switch (isWinning.winType) {
        case WINNINGTYPE.REGULAR:
          console.log("Regular Win! Calculating payout...");
          payout = await calculatePayout(this, middleRow, isWinning.symbolId, WINNINGTYPE.REGULAR);

          console.log("Payout:", payout);
          break;

        case WINNINGTYPE.MIXED:
          console.log("Mixed Win! Calculating mixed payout...");
          payout = await calculatePayout(this, middleRow, isWinning.symbolId, WINNINGTYPE.MIXED);
          console.log("Mixed Payout:", payout);
          break;

        default:
          console.log("No specific win condition met. Applying default payout.");
          payout = this.settings.defaultPayout * this.settings.BetPerLines;
          this.playerData.currentWining = payout
          console.log("Default Payout:", payout);
          break;
      }

      if (payout > 0 && !this.settings.isFreeSpin) {
        payout = await applyExtraSymbolEffect(this, payout, extrasymbol);
        this.playerData.currentWining = payout
        this.updatePlayerBalance(this.playerData.currentWining)
        makeResultJson(this)
      }

      makeResultJson(this)

      console.log("Total Payout for:", this.getPlayerData().username, "" + payout);
      console.log("Total Free Spins Remaining:", this.settings.freeSpinCount);


    } catch (error) {
      console.error("Error in checkResult:", error);
    }
  }
}
