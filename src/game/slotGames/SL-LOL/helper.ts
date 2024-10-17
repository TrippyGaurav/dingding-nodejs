import { SLLOL } from './LifeOfLuxury';
import { SymbolType, GameResult, GameConfig, WinningCombination } from './types';
import { WinData } from "../BaseSlotGame/WinData";
import { convertSymbols, UiInitData } from '../../Utils/gameUtils';


export function initializeGameSettings(gameData: any, gameInstance: SLLOL) {
  return {
    id: gameData.gameSettings.id,
    isSpecial: gameData.gameSettings.isSpecial,
    matrix: gameData.gameSettings.matrix,
    isEnabled: gameData.gameSettings.isEnabled,
    bets: gameData.gameSettings.bets,
    Symbols: gameInstance.initSymbols,
    resultSymbolMatrix: [],
    currentGamedata: gameData.gameSettings,
    _winData: new WinData(gameInstance),
    currentBet: 0,
    currentLines: 0,
    BetPerLines: 0,
    reels: [],
    // scatterBlue: gameData.gameSettings.scatterBlue,
    // scatterPurple: gameData.gameSettings.scatterPurple,
    // joker: gameData.gameSettings.joker,
    // booster: gameData.gameSettings.booster,
    // levelUp: gameData.gameSettings.levelUp,
    defaultPayout: gameData.gameSettings.defaultPayout,
    // SpecialType: gameData.gameSettings.SpecialType,
    // freeSpinCount: 0,
    // freeSpinType: "NONE" as "NONE" | "BLUE" | "PURPLE",
    // multiplierType: "NONE" as "NONE" | "SIMPLE" | "EXHAUSTIVE",
  }
}

export function generateInitialReel(gameSettings: any): number[][] {
  const reels: number[][] = [];
  const numReels = gameSettings.matrix[0].length; // Assuming matrix represents the game grid

  for (let i = 0; i < numReels; i++) {
    const reel: number[] = [];
    gameSettings.Symbols.forEach(symbol => {
      const count = symbol.reelInstance[i] || 0; // Using reelInstance[i] for frequency on each reel
      for (let j = 0; j < count; j++) {
        reel.push(symbol.Id);
      }
    });

    shuffleArray(reel);
    reels.push(reel);
  }

  return reels;
}

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function sendInitData(gameInstance: SLLOL) {
  UiInitData.paylines = convertSymbols(gameInstance.settings.Symbols);
  const credits = gameInstance.getPlayerData().credits
  const Balance = credits.toFixed(2)
  const reels = generateInitialReel(gameInstance.settings);
  gameInstance.settings.reels = reels;
  const dataToSend = {
    GameData: {
      // Reel: reels,
      Bets: gameInstance.settings.currentGamedata.bets,
    },
    UIData: UiInitData,
    PlayerData: {
      Balance: Balance,
      haveWon: gameInstance.playerData.haveWon,
      currentWining: gameInstance.playerData.currentWining,
      totalbet: gameInstance.playerData.totalbet,
    },
  };
  gameInstance.sendMessage("InitData", dataToSend);
}
export function makeResultJson(gameInstance: SLLOL) {
  try {
    const { settings, playerData } = gameInstance;
    const credits = gameInstance.getPlayerData().credits
    const Balance = credits.toFixed(2)
    const sendData = {
      gameData: {
        resultSymbols: settings.resultSymbolMatrix,
        // isFreeSpin: settings.isFreeSpin,
        // freeSpinCount: settings.freeSpinCount
      },
      PlayerData: {
        Balance: Balance,
        currentWining: playerData.currentWining,
        totalbet: playerData.totalbet,
        haveWon: playerData.haveWon,
      }
    };

    gameInstance.sendMessage('ResultData', sendData);
  } catch (error) {
    console.error("Error generating result JSON or sending message:", error);
  }
}


export function getRandomSymbolForReel(symbols: SymbolType[], reelIndex: number): number {
  const availableSymbols = symbols.filter(symbol => symbol.reelInstance.hasOwnProperty(reelIndex));
  const totalInstances = availableSymbols.reduce((sum, symbol) => sum + symbol.reelInstance[reelIndex], 0);
  let randomValue = crypto.getRandomValues(new Uint32Array(1))[0] % totalInstances;

  for (const symbol of availableSymbols) {
    if (randomValue < symbol.reelInstance[reelIndex]) {
      return symbol.Id;
    }
    randomValue -= symbol.reelInstance[reelIndex];
  }

  // This should never happen, but TypeScript requires a return statement
  return availableSymbols[0].Id;
}

export function printMatrix(matrix: GameResult, getSymbol: (id: number) => SymbolType | undefined, config: GameConfig): void {
  const symbolNames = matrix.map(col => 
    col.map(symbolId => getSymbol(symbolId)?.Name.substring(0, 4) || 'Unkn')
  );

  for (let row = 0; row < config.rows; row++) {
    console.log(symbolNames.map(col => col[row].padEnd(4)).join(' | '));
  }
}

export function printWinningCombination(result: GameResult, positions: [number, number][], getSymbol: (id: number) => SymbolType | undefined, config: GameConfig): void {
  const matrix = Array(config.rows).fill(null).map(() => 
    Array(config.reels).fill(' -- ')
  );

  positions.forEach(([col, row]) => {
    const symbolName = getSymbol(result[col][row])?.Name.substring(0, 4) || 'Unkn';
    matrix[row][col] = symbolName.padEnd(4);
  });

  for (let row = 0; row < config.rows; row++) {
    console.log(matrix[row].join(' | '));
  }
}

export function logGame(result: GameResult, payout: number, winningCombinations: WinningCombination[], getSymbol: (id: number) => SymbolType | undefined, config: GameConfig): void {
  console.log("Game Result:");
  printMatrix(result, getSymbol, config);
  console.log("\nTotal Payout:", payout);
  
  if (winningCombinations.length > 0) {
    console.log("\nWinning Combinations:");
    winningCombinations.forEach((combo, index) => {
      const symbol = getSymbol(combo.symbolId);
      console.log(`\nCombination ${index + 1}:`);
      console.log(`Symbol: ${symbol?.Name}`);
      console.log(`Payout: ${combo.payout}`);
      printWinningCombination(result, combo.positions, getSymbol, config);
    });
  } else {
    console.log("\nNo winning combinations.");
  }
}

