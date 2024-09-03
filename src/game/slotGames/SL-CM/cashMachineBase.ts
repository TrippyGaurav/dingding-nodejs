import { currentGamedata } from "../../../Player";
import { WinData } from "../BaseSlotGame/WinData";
import { RandomResultGenerator } from "../RandomResultGenerator";
import { CMSettings } from "./types";
import { initializeGameSettings, generateInitialReel, sendInitData } from "./helper";

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
    this.settings.matrix.x = 3;
    this.settings.currentLines = data.currentLines;
    this.settings.BetPerLines = this.settings.currentGamedata.bets[data.currentBet];
    this.settings.currentBet = this.settings.BetPerLines * this.settings.currentLines;
  }

  private async spinResult() {
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

  private checkResult() {
    if (this.settings.freezeIndex.length > 0 && this.settings.hasRespin) {
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
      // Use JSON.stringify for deep comparison of objects
      const allValuesSame = currentArr.every((item, index) => {
        return JSON.stringify(item) === JSON.stringify(newMatrix[index]);
      });

      console.log(allValuesSame, 'allValuesSame');

      if (allValuesSame) {
        console.log('All values are the same. Respin stopped.');
        this.settings.hasRespin = false;
        this.settings.freezeIndex = [];
        return
      } else {
        this.settings.resultSymbolMatrix[0] = newMatrix;
        this.settings.freezeIndex = [];
        this.settings.hasRespin = false;
      }
    }









    const resultRow = this.settings.resultSymbolMatrix[0];
    const preProcessedResult = resultRow.map(element => {
      const symbol = this.settings.Symbols.find(sym => sym.Id === element);
      return symbol
    });

    const shouldRespin = this.hasRespinPattern(preProcessedResult);
    const processedResult = preProcessedResult.map(element => {
      if (element.Name === "00") {
        return shouldRespin ? "0" : "00";
      }
      return element;
    });


    this.settings.resultSymbolMatrix = processedResult;
    const totalPayout = processedResult
      .reduce((acc, symbol) => {
        if (symbol.Name !== undefined) {
          const newPayout = acc + symbol.payout;
          return newPayout;
        }
        return acc;
      }, '')
      .trim();

    const finalPayout = totalPayout ? parseInt(totalPayout, 10) : 0;
    this.playerData.currentPayout = totalPayout;



    console.log('SYMBOLS:', this.settings.resultSymbolMatrix);
    console.log('FINALPAY:', finalPayout);
    if (shouldRespin && finalPayout === 0) {
      this.initiateRespin(this.settings.resultSymbolMatrix);
    }
  }

  private hasRespinPattern(result: any[]): boolean {

    const hasRespin = result.some(element => element.Name === "0" || element.Name === "doubleZero")
    return hasRespin

  }

  private async initiateRespin(currentArr: any[]) {
    console.log('RE-SPIN')
    this.settings.hasRespin = true;
    this.settings.lastReSpin = currentArr.map(item => item.Id);
    const currentFreezeIndexes = currentArr
      .map((item, index) => (item.Name == "0" || item.Name == "doubleZero" ? index : -1))
      .filter(index => index !== -1);
    this.settings.freezeIndex = currentFreezeIndexes;
    if (this.settings.freezeIndex.length > 0 && this.settings.hasRespin) {
      this.spinResult()
    }
  }
}
