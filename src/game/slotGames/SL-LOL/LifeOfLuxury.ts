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

    const isMatchOrWild = (symbolId: number, targetId: number) => {
      const symbol = getSymbol(symbolId);
      return symbolId === targetId || (symbol?.Name === "Wild" && symbol.Id !== targetId);
    };

    // Helper function to create a new matrix
    const createMatrix = () => Array(this.config.rows).fill(null).map(() => Array(this.config.reels).fill(false));

    // Check all symbols in the first column
    for (let startRow = 0; startRow < this.config.rows; startRow++) {
      const startSymbolId = result[0][startRow];
      const startSymbol = getSymbol(startSymbolId);
      if (!startSymbol || startSymbol.Name === "Wild") continue;

      // Initialize ways with all matching symbols in the first column
      let ways: { path: number[]; matrix: boolean[][] }[] = [];
      for (let row = 0; row < this.config.rows; row++) {
        if (isMatchOrWild(result[0][row], startSymbolId)) {
          const matrix = createMatrix();
          matrix[row][0] = true;
          ways.push({ path: [result[0][row]], matrix });
        }
      }

      // Check subsequent columns
      for (let col = 1; col < this.config.reels; col++) {
        const newWays: typeof ways = [];

        for (const way of ways) {
          let matchFound = false;
          for (let row = 0; row < this.config.rows; row++) {
            const symbolId = result[col][row];
            if (isMatchOrWild(symbolId, startSymbolId)) {
              const newPath = [...way.path, symbolId];
              const newMatrix = way.matrix.map(row => [...row]);
              newMatrix[row][col] = true;
              newWays.push({ path: newPath, matrix: newMatrix });
              matchFound = true;
            }
          }
          if (!matchFound) {
            // If no match is found in this column, the current way ends here
            if (way.path.length >= this.config.minMatchCount) {
              newWays.push(way);
            }
          }
        }

        if (newWays.length === 0) break;
        ways = newWays;
      }

      // Process winning combinations
      for (const way of ways) {
        if (way.path.length >= this.config.minMatchCount) {
          const wildCount = way.path.filter(id => getSymbol(id)?.Name === "Wild").length;
          const payoutIndex = Math.min(way.path.length - this.config.minMatchCount, startSymbol.payout.length - 1);
          const combinationPayout = startSymbol.payout[payoutIndex];
          totalPayout += combinationPayout;

          winningCombinations.push({
            symbols: way.path,
            count: way.path.length,
            wildCount,
            payout: combinationPayout,
            matrix: way.matrix
          });
        }
      }
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
    reelInstance: { 0: 20, 1: 20, 2: 20, 3: 20, 4: 20 },
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
