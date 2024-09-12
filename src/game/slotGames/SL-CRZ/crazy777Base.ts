import { currentGamedata } from "../../../Player";
import { WinData } from "../BaseSlotGame/WinData";
import { RandomResultGenerator } from "../RandomResultGenerator";
import { CRZSETTINGS } from "./types";
import { initializeGameSettings, generateInitialReel, sendInitData, calculatePayout, applyExtraSymbolEffect, checkWinningCondition} from "./helper";

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
    this.settings.matrix.x;
    this.settings.matrix.y;
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
      new RandomResultGenerator(this);
      this.checkResult();
    } catch (error) {
      this.sendError("Spin error");
      console.error("Failed to generate spin results:", error);
    }
  }

  private checkResult() {
    const resultmatrix = this.settings.resultSymbolMatrix;
    const checkMatrix = resultmatrix.map(row => row.slice(0, 3)); 
    const specialMatrix = resultmatrix.map(row => row[3]); 
    console.log("Result Matrix",resultmatrix);
    
    const middleRow = checkMatrix[1]; 
    const extrasymbol = specialMatrix[1]; 
    
    console.log("Middle row:", middleRow);
    console.log("Special element:", extrasymbol);
    if (middleRow.includes(0)) {
        console.log("No win: '0' present in the middle row.");
        return; 
    }
    // Check if all symbols are the same or if they match the mixed condition
    const isWinning = checkWinningCondition(this, middleRow);

    let payout = 0;

    if (isWinning.winType === 'regular') {
        console.log("Regular Win! Calculating payout...");
        payout =calculatePayout(this, middleRow, isWinning.symbolId, 'regular');
        console.log("Payout:", payout);
    } else if (isWinning.winType === 'mixed') {
        console.log("Mixed Win! Calculating mixed payout...");
        payout = calculatePayout(this, middleRow, isWinning.symbolId, 'mixed');
        console.log("Mixed Payout:", payout);
    } else {
        console.log("No specific win condition met. Applying default payout.");
        payout = this.settings.defaultPayout * this.settings.currentBet; 
        console.log("Default Payout:", payout);
    }

    if (payout > 0 && !this.settings.isFreeSpin) {
        payout = applyExtraSymbolEffect(this, payout, extrasymbol);
    }
    console.log("Total Payout:", payout);
    console.log("Total Free");
    if (this.settings.isFreeSpin )
    {
      this.settings.freeSpinCount --;
    }
    if(this.settings.freeSpinCount == 0)
    {
      this.settings.isFreeSpin =false; 
    }
}



}
