import { currentGamedata } from "../../../Player";
import { generateInitialReel, getRandomSymbolForReel, initializeGameSettings, printMatrix, printWinningCombination, sendInitData } from "./helper";
import { GameConfig, GameResult, SLLOLSETTINGS, SymbolType, WinningCombination } from "./types";

export class SLLOL {
  private symbols: SymbolType[];
  private config: GameConfig;
  public settings: SLLOLSETTINGS;
  playerData = {
    haveWon: 0,
    currentWining: 0,
    totalbet: 0,
    rtpSpinCount: 0,
    totalSpin: 0,
    currentPayout: 0
  }

  constructor(public currentGameData: currentGamedata) {
    this.settings = initializeGameSettings(currentGameData, this);
    generateInitialReel(this.settings)
    sendInitData(this)
    // this.symbols = symbols;
    // this.config = config;
  }
  get initSymbols() {
    const Symbols = [];
    this.currentGameData.gameSettings.Symbols.forEach((Element: Symbol) => {
      Symbols.push(Element);
    });
    return Symbols;
  }

  private getSymbol(id: number): SymbolType | undefined {
    return this.symbols.find(s => s.Id === id);
  }

  private isWild(symbolId: number): boolean {
    const symbol = this.getSymbol(symbolId);
    return symbol ? symbol.Name === "Wild" : false;
  }

  private spin(): GameResult {
    const result: GameResult = [];
    for (let reel = 0; reel < this.config.reels; reel++) {
      const reelSymbols: number[] = [];
      for (let row = 0; row < this.config.rows; row++) {
        reelSymbols.push(getRandomSymbolForReel(this.symbols, reel));
      }
      result.push(reelSymbols);
    }
    return result;
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
        this.getRTP(response.data.spins || 1);
        break;
    }
  }
  private prepareSpin(data: any) {
    this.settings.currentLines = data.currentLines;
    this.settings.BetPerLines = this.settings.currentGamedata.bets[data.currentBet];
    this.settings.currentBet = this.settings.BetPerLines * this.settings.currentLines;
  }

  private async spinResult(): Promise<void> {
    try {
      //TODO:
      const playerData = this.settings._winData.slotGame.getPlayerData()
      // console.log('playerCredits', playerData.credits);
      //NOTE: low balance
      if (this.settings.currentBet > playerData.credits) {
        console.log('Low Balance', playerData.credits);
        console.log('Current Bet', this.settings.currentBet);
        this.sendError("Low Balance");
        return
      }
      //TODO: bonus games 
      //free spins n boosters

      //NOTE: deduct balance
      this.deductPlayerBalance(this.settings.currentBet);
      this.playerData.totalbet += this.settings.currentBet;

      this.randomResultGenerator()
      this.checkResult()
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
  private async checkResult() {
    try {
      //TODO:
      const resultmatrix = this.settings.resultSymbolMatrix
      console.log("Result Matrix:", resultmatrix);
      // console.log("base Pay", this.settings.Symbols[resultmatrix[0]].payout);
      // calculatePayout(this)
      const playerData = this.settings._winData.slotGame.getPlayerData()
      console.log('playerCredits', playerData.credits);
    } catch (error) {
      console.error("Error in checkResult:", error);
    }
  }
  private async randomResultGenerator() {
    try {
      //TODO:
      const getRandomIndex = (maxValue: number): number => {
        return Math.floor(Math.random() * (maxValue + 1));
      }
      const reel = this.settings.reels
      const index = getRandomIndex(reel.length - 1)
      this.settings.resultSymbolMatrix = [reel[index]]
    } catch (error) {
      console.error("Error in randomResultGenerator:", error);
    }
  }
  private checkWin(result: GameResult): { payout: number; winningCombinations: WinningCombination[] } {
    let totalPayout = 0;
    let winningCombinations: WinningCombination[] = [];

    const findCombinations = (symbolId: number, col: number, path: [number, number][]): void => {
      if (col === this.config.reels) {
        if (path.length >= this.config.minMatchCount) {
          const symbol = this.getSymbol(symbolId)!;
          const payoutIndex = Math.min(path.length - this.config.minMatchCount, symbol.payout.length - 1);
          const payout = symbol.payout[payoutIndex];
          winningCombinations.push({ symbolId, positions: path, payout });
        }
        return;
      }

      for (let row = 0; row < this.config.rows; row++) {
        const currentSymbolId = result[col][row];
        if (currentSymbolId === symbolId || this.isWild(currentSymbolId)) {
          findCombinations(symbolId, col + 1, [...path, [col, row]]);
        }
      }

      // End the combination if it's long enough
      if (path.length >= this.config.minMatchCount) {
        const symbol = this.getSymbol(symbolId)!;
        const payoutIndex = Math.min(path.length - this.config.minMatchCount, symbol.payout.length - 1);
        const payout = symbol.payout[payoutIndex];
        winningCombinations.push({ symbolId, positions: path, payout });
      }
    };

    // Check for each non-Wild symbol
    this.symbols.forEach(symbol => {
      if (symbol.Name !== "Wild") {
        for (let row = 0; row < this.config.rows; row++) {
          const startSymbolId = result[0][row];
          if (startSymbolId === symbol.Id || this.isWild(startSymbolId)) {
            findCombinations(symbol.Id, 1, [[0, row]]);
          }
        }
      }
    });

    // Filter out shorter combinations that are subsets of longer ones
    winningCombinations = winningCombinations.filter((combo, index, self) =>
      !self.some((otherCombo, otherIndex) =>
        index !== otherIndex &&
        combo.symbolId === otherCombo.symbolId &&
        combo.positions.length < otherCombo.positions.length &&
        combo.positions.every((pos, i) => pos[0] === otherCombo.positions[i][0] && pos[1] === otherCombo.positions[i][1])
      )
    );

    // Calculate total payout
    totalPayout = winningCombinations.reduce((sum, combo) => sum + combo.payout, 0);

    return { payout: totalPayout, winningCombinations };
  }

  play(): { result: GameResult; payout: number; winningCombinations: WinningCombination[] } {
    const result = this.spin();
    const { payout, winningCombinations } = this.checkWin(result);
    return { result, payout, winningCombinations };
  }

  logGame(result: GameResult, payout: number, winningCombinations: WinningCombination[]): void {
    console.log("Game Result:");
    printMatrix(result, this.getSymbol, this.config);
    console.log("\nTotal Payout:", payout);

    if (winningCombinations.length > 0) {
      console.log("\nWinning Combinations:");
      winningCombinations.forEach((combo, index) => {
        const symbol = this.getSymbol(combo.symbolId);
        console.log(`\nCombination ${index + 1}:`);
        console.log(`Symbol: ${symbol?.Name}`);
        console.log(`Payout: ${combo.payout}`);
        printWinningCombination(result, combo.positions, this.getSymbol, this.config);
        // this.printWinningCombination(result, combo.positions);
      });
    } else {
      console.log("\nNo winning combinations.");
    }
  }

}

// Define symbols
// const symbols: SymbolType[] = [
//   {
//     Name: "JetPlane",
//     Id: 0,
//     isSpecial: false,
//     reelInstance: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2 },
//     payout: [1000, 500, 100],
//   },
//   {
//     Name: "Yacht",
//     Id: 1,
//     isSpecial: false,
//     reelInstance: { 0: 3, 1: 3, 2: 3, 3: 3, 4: 3 },
//     payout: [500, 250, 50],
//   },
//   {
//     Name: "Sportscar",
//     Id: 2,
//     isSpecial: false,
//     reelInstance: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4 },
//     payout: [250, 100, 25],
//   },
//   {
//     Name: "Diamond",
//     Id: 3,
//     isSpecial: false,
//     reelInstance: { 0: 5, 1: 5, 2: 5, 3: 5, 4: 5 },
//     payout: [100, 50, 10],
//   },
//   {
//     Name: "Gold Bar",
//     Id: 4,
//     isSpecial: false,
//     reelInstance: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6 },
//     payout: [50, 25, 5],
//   },
//   {
//     Name: "Champagne",
//     Id: 5,
//     isSpecial: false,
//     reelInstance: { 0: 7, 1: 7, 2: 7, 3: 7, 4: 7 },
//     payout: [25, 10, 3],
//   },
//   {
//     Name: "Wild",
//     Id: 6,
//     isSpecial: true,
//     reelInstance: { 1: 3, 2: 3, 3: 3 }, // Removed from the first reel
//     payout: [2000, 1000, 200],
//   },
// ];

// Define game configuration
// const gameConfig: GameConfig = {
//   rows: 3,
//   reels: 5,
//   minMatchCount: 3
// };

// const game = new SLLOL(symbols, gameConfig);

// const result = [
//   [0, 1, 2],  // JetP, Yach, Spor
//   [6, 6, 6],  // Wild, Wild, Wild
//   [6, 1, 6],  // Wild, Yach, Wild
//   [6, 3, 6],  // Wild, Diam, Wild
//   [4, 4, 0],  // Gold, Gold, JetP
// ];

// const { result, payout, winningCombinations } = game.play();
// game.logGame(result , payout, winningCombinations );
