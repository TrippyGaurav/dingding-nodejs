import { log } from "console";
import { currentGamedata } from "../../../Player";
import { gameData } from "../../testData";
import {  convertSymbols, shuffleArray, UiInitData } from "../../Utils/gameUtils";
import { GameData } from "../BaseSlotGame/gameType";
import { WinData } from "../BaseSlotGame/WinData";
import { RandomResultGenerator } from "../RandomResultGenerator";
import { int } from "aws-sdk/clients/datapipeline";


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
    this.settings = {
      id: currentGameData.gameSettings.id,
      isSpecial: currentGameData.gameSettings.isSpecial,
      matrix: currentGameData.gameSettings.matrix,
      bets: currentGameData.gameSettings.bets,
      Symbols: this.initSymbols,
      resultSymbolMatrix: [],
      currentGamedata: currentGameData.gameSettings,
      _winData: new WinData(this),
      currentBet: 0, // Set initial value
      currentLines: 0, // Set initial value
      BetPerLines: 0, // Set initial value
      reels: [], // Initialize reels array
      lastRedSpin: [],
      lastReSpin: [],

    };
    this.initialize(currentGameData.gameSettings);
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
  updatePlayerBalance(message: number) {
    this.currentGameData.updatePlayerBalance(message);
  }
  deductPlayerBalance(message: number) {
    this.currentGameData.deductPlayerBalance(message);
  }
  getPlayerData() {
    return this.currentGameData.getPlayerData();
  }

  messageHandler(response: any) {
    switch (response.id) {
      case "SPIN":
        this.settings.matrix.x = 3;
        this.settings.currentLines = response.data.currentLines;
        this.settings.BetPerLines = this.settings.currentGamedata.bets[response.data.currentBet];
        this.settings.currentBet =
          this.settings.currentGamedata.bets[response.data.currentBet] *
          this.settings.currentLines;
        this.spinResult();
        break;

    }
  }

  private initialize(gameData: any) {
    this.settings.currentGamedata = gameData;
    this.settings._winData = new WinData(this);
    UiInitData.paylines = convertSymbols(this.settings.currentGamedata.Symbols);
    this.sendInitdata();
  }

  public sendInitdata() {
    this.settings.reels = this.generateInitialreel();
    const dataToSend = {
      GameData: {
        Reel: this.settings.reels,
        Bets: this.settings.currentGamedata.bets,
        autoSpin: [1, 5, 10, 20],
      },
      UIData: UiInitData,
      PlayerData: {
        Balance: this.getPlayerData().credits,
        haveWon: this.playerData.haveWon,
        currentWining: this.playerData.currentWining,
        totalbet: this.playerData.totalbet,
      },
    };

    this.sendMessage("InitData", dataToSend);
  }

  private generateInitialreel(): string[][] {
    const reels = [[], [], []];

    this.settings.currentGamedata.Symbols.forEach(symbol => {
      for (let i = 0; i < 3; i++) {
        const count = symbol.reelInstance[i] || 0;
        for (let j = 0; j < count; j++) {
          reels[i].push(symbol.Id);
        }
      }
    });
    // 
    // Shuffle each reel individually
    reels.forEach(reel => {
      for (let i = reel.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [reel[i], reel[j]] = [reel[j], reel[i]];
      }
    });
    return reels;
  }

  get initSymbols() {
    const Symbols = [];
    this.currentGameData.gameSettings.Symbols.forEach((Element: Symbol) => {
      Symbols.push(Element);
    });
    return Symbols;
  }

  isRandomNumberGreaterThan(percentage: number): boolean {
    const randomNumber = Math.floor(Math.random() * 2);
    return randomNumber > percentage / 100;
  }





  private async spinResult() {
    try {
      const playerData = this.getPlayerData();
      if (this.settings.currentBet > playerData.credits) {
        console.log("Low Balance : ", playerData.credits);
        console.log("Current Bet : ", this.settings.currentBet);
        this.sendError("Low Balance");
        return;
      }
      await this.deductPlayerBalance(this.settings.currentBet);
      this.settings.lastReSpin = [];
      this.settings.lastRedSpin = [];
      this.playerData.totalbet += this.settings.currentBet;
      new RandomResultGenerator(this);
      this.checkResult();
    } catch (error) {
      console.error("Failed to generate spin results:", error);
      this.sendError("Spin error");
    }
  }

  private checkResult() {
    const resultRow = this.settings.resultSymbolMatrix[0];

    for (const { Index, Symbol } of this.settings.lastReSpin) {
      resultRow[Index] = Symbol.Id;
    }

    for (const { Index, Symbol } of this.settings.lastRedSpin) {
      resultRow[Index] = Symbol.Id;
    }

    const processedResult = resultRow.map(element => {
      const symbol = this.settings.Symbols.find(sym => sym.Id === element);
      return symbol?.Id !== 0 ? symbol : "Blank";
    });

    this.settings.resultSymbolMatrix = processedResult;

    const totalPayout = processedResult
      .filter(symbol => symbol !== "Blank")
      .reduce((acc, symbol) => acc + parseInt(symbol.payout || "0", 10), 0);

    this.playerData.currentPayout = totalPayout;

    console.log("After", this.settings.resultSymbolMatrix);
    console.log(`Total payout: ${totalPayout}`);

    const shouldRespin = totalPayout === 0 && this.hasRespinPattern(processedResult);

    if (shouldRespin) {
      this.initiateRespin();
    }
  }

  private hasRespinPattern(result: any[]): boolean {
    for (let i = 0; i < result.length - 2; i++) {
      if (
        (result[i] === "Blank" && result[i + 1] === 0 && result[i + 2] === 0) ||
        (result[i] === 0 && result[i + 1] === "Blank" && result[i + 2] === 0) ||
        (result[i] === 0 && result[i + 1] === 0 && result[i + 2] === "Blank")
      ) {
        return true;
      }
    }
    return false;
  }

  private initiateRespin() {
    console.log("Initiating re-spin due to specific pattern or total payout being 0.");

  }

}












interface Symbol {
  Name: string;
  Id: number;
  payout: string;
  canCallRedSpin: boolean;
  canCallRespin: boolean;
  reelInstance: { [key: string]: number };
}

interface CMSettings {
  id: string;
  isSpecial: boolean;
  matrix: { x: number, y: number };
  currentGamedata: GameData;
  resultSymbolMatrix: any[];
  _winData: WinData | undefined;
  currentBet: number;
  currentLines: number;
  BetPerLines: number;
  bets: number[];
  reels: any[][];
  Symbols: Symbol[];
  lastRedSpin: { Index: number, Symbol: Symbol }[],
  lastReSpin: { Index: number, Symbol: Symbol }[],


}