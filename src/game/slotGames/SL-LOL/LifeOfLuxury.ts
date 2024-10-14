interface SymbolType {
  Name: string;
  Id: number;
  isSpecial: boolean;
  reelInstance: { [key: number]: number };
  payout: number[];
}

type GameResult = number[][];

interface GameConfig {
  rows: number;
  reels: number;
  minMatchCount: number;
}

class SlotGame {
  private symbols: SymbolType[];
  private reels: number[][];
  private config: GameConfig;

  constructor(symbols: SymbolType[], config: GameConfig) {
    this.symbols = symbols;
    this.config = config;
    this.reels = this.initializeReels();
  }

  private initializeReels(): number[][] {
    return Array(this.config.reels).fill(null).map((_, reelIndex) => {
      const reelSymbols: number[] = [];
      this.symbols.forEach(symbol => {
        if (reelIndex === 0 && symbol.Name === "Wild") return; // Exclude Wild from the first reel
        const count = symbol.reelInstance[reelIndex] || 0;
        reelSymbols.push(...Array(count).fill(symbol.Id));
      });
      return this.shuffleArray(reelSymbols);
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private spinReel(reelIndex: number): number[] {
    const reel = this.reels[reelIndex];
    const result: number[] = [];
    for (let i = 0; i < this.config.rows; i++) {
      const randomIndex = Math.floor(Math.random() * reel.length);
      result.push(reel[randomIndex]);
    }
    return result;
  }

  spin(): GameResult {
    return Array(this.config.reels).fill(null).map((_, index) => this.spinReel(index));
  }

checkWin(result: GameResult): { payout: number; winningCombinations: WinningCombination[] } {
  let totalPayout = 0;
  const winningCombinations: WinningCombination[] = [];

  const getSymbol = (id: number) => this.symbols.find(s => s.Id === id);

  // Check for horizontal wins
  for (let startRow = 0; startRow < this.config.rows; startRow++) {
    let currentSymbolId = result[0][startRow];
    let count = 1;
    let wildCount = 0;
    const winMatrix: boolean[][] = Array(this.config.rows).fill(null).map(() => Array(this.config.reels).fill(false));
    winMatrix[startRow][0] = true;
    const way = [currentSymbolId];

    for (let reel = 1; reel < this.config.reels; reel++) {
      let matchFound = false;
      for (let row = 0; row < this.config.rows; row++) {
        const symbolId = result[reel][row];
        const symbol = getSymbol(symbolId);

        if (symbol?.Name === "Wild" || symbolId === currentSymbolId) {
          if (symbol?.Name === "Wild") wildCount++;
          count++;
          way.push(symbolId);
          winMatrix[row][reel] = true;
          matchFound = true;
          break;
        }
      }

      if (!matchFound) break;
    }

    if (count >= this.config.minMatchCount) {
      const symbol = getSymbol(currentSymbolId);
      if (symbol) {
        const payoutIndex = Math.min(count - this.config.minMatchCount, symbol.payout.length - 1);
        const combinationPayout = symbol.payout[payoutIndex];
        totalPayout += combinationPayout;

        winningCombinations.push({
          symbols: way,
          count,
          wildCount,
          payout: combinationPayout,
          matrix: winMatrix
        });
      }
    }
  }

  // Check for vertical wins
  for (let reelIndex = 0; reelIndex < this.config.reels; reelIndex++) {
    const symbolCounts: { [id: number]: number } = {};
    const winMatrix: boolean[][] = Array(this.config.rows).fill(null).map(() => Array(this.config.reels).fill(false));

    for (let row = 0; row < this.config.rows; row++) {
      const symbolId = result[reelIndex][row];
      symbolCounts[symbolId] = (symbolCounts[symbolId] || 0) + 1;
      winMatrix[row][reelIndex] = true;
    }

    Object.entries(symbolCounts).forEach(([symbolIdStr, count]) => {
      const symbolId = parseInt(symbolIdStr);
      if (count >= this.config.minMatchCount) {
        const symbol = getSymbol(symbolId);
        if (symbol) {
          const payoutIndex = Math.min(count - this.config.minMatchCount, symbol.payout.length - 1);
          const combinationPayout = symbol.payout[payoutIndex];
          totalPayout += combinationPayout;

          winningCombinations.push({
            symbols: Array(count).fill(symbolId),
            count,
            wildCount: 0, // Adjust if Wild symbols are allowed in vertical wins
            payout: combinationPayout,
            matrix: winMatrix
          });
        }
      }
    });
  }

  return { payout: totalPayout, winningCombinations };
}

  play(): { result: GameResult; payout: number; winningCombinations: WinningCombination[] } {
    const result = this.spin();
    const { payout, winningCombinations } = this.checkWin(result);
    return { result, payout, winningCombinations };
  }

  private getSymbolName(id: number): string {
    return this.symbols.find(s => s.Id === id)?.Name || 'Unknown';
  }

  logGame(result: GameResult, payout: number, winningCombinations: WinningCombination[]): void {
    console.log("Game Result:");
    for (let row = 0; row < this.config.rows; row++) {
      console.log(result.map(col => this.getSymbolName(col[row]).substring(0, 4)).join(' | '));
    }
    console.log("\nTotal Payout:", payout);
    
    if (winningCombinations.length > 0) {
      console.log("\nWinning Combinations:");
      winningCombinations.forEach((combo, index) => {
        console.log(`\nCombination ${index + 1}:`);
        console.log(`Symbols: ${combo.symbols.map(id => this.getSymbolName(id)).join(' - ')}`);
        console.log(`Count: ${combo.count} (including ${combo.wildCount} wilds)`);
        console.log(`Payout: ${combo.payout}`);
        console.log("Win Matrix:");
        for (let row = 0; row < this.config.rows; row++) {
          console.log(combo.matrix[row].map(cell => cell ? 'X' : '-').join(' '));
        }
      });
    } else {
      console.log("\nNo winning combinations.");
    }
  }
}

interface WinningCombination {
  symbols: number[];
  count: number;
  wildCount: number;
  payout: number;
  matrix: boolean[][];
}

// Define symbols
const symbols: SymbolType[] = [
  {
    Name: "JetPlane",
    Id: 0,
    isSpecial: false,
    reelInstance: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2 },
    payout: [1000, 500, 100],
  },
  {
    Name: "Yacht",
    Id: 1,
    isSpecial: false,
    reelInstance: { 0: 3, 1: 3, 2: 3, 3: 3, 4: 3 },
    payout: [500, 250, 50],
  },
  {
    Name: "Sportscar",
    Id: 2,
    isSpecial: false,
    reelInstance: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4 },
    payout: [250, 100, 25],
  },
  {
    Name: "Diamond",
    Id: 3,
    isSpecial: false,
    reelInstance: { 0: 5, 1: 5, 2: 5, 3: 5, 4: 5 },
    payout: [100, 50, 10],
  },
  {
    Name: "Gold Bar",
    Id: 4,
    isSpecial: false,
    reelInstance: { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6 },
    payout: [50, 25, 5],
  },
  {
    Name: "Champagne",
    Id: 5,
    isSpecial: false,
    reelInstance: { 0: 7, 1: 7, 2: 7, 3: 7, 4: 7 },
    payout: [25, 10, 3],
  },
  {
    Name: "Wildd",
    Id: 6,
    isSpecial: true,
    reelInstance: { 1: 1, 2: 1, 3: 1, 4: 1 }, // Removed from the first reel
    payout: [2000, 1000, 200],
  },
];

// Define game configuration
const gameConfig: GameConfig = {
  rows: 3,
  reels: 5,
  minMatchCount: 3
};

const game = new SlotGame(symbols, gameConfig);
const { result, payout, winningCombinations } = game.play();
game.logGame(result, payout, winningCombinations);
