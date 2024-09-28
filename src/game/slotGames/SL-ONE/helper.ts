import { convertSymbols, UiInitData } from "../../Utils/gameUtils";
import { WinData } from "../BaseSlotGame/WinData";
import { SLONE } from "./OneOfAKindBase";
import { Symbol } from "./types";

interface BoosterResult {
  type: 'NONE' | 'SIMPLE' | 'EXHAUSTIVE';
  multipliers: number[];
}
interface LevelUpResult {
  level: number;
  isLevelUp: boolean;
}


export function initializeGameSettings(gameData: any, gameInstance: SLONE) {
  return {
    id: gameData.gameSettings.id,
    isSpecial: gameData.gameSettings.isSpecial,
    matrix: gameData.gameSettings.matrix,
    bets: gameData.gameSettings.bets,
    Symbols: gameInstance.initSymbols,
    resultSymbolMatrix: [],
    currentGamedata: gameData.gameSettings,
    _winData: new WinData(gameInstance),
    currentBet: 0,
    currentLines: 0,
    BetPerLines: 0,
    reels: [],
    scatterBlue: gameData.gameSettings.scatterBlue,
    booster: gameData.gameSettings.booster,
    levelUp: gameData.gameSettings.levelUp,
    defaultPayout: gameData.gameSettings.defaultPayout,
    SpecialType: gameData.gameSettings.SpecialType,
    freeSpinCount: 0,
    freeSpinType: "",
    isFreeSpin: false,
    isMultiplier: false,
    multiplierType: ""
  }
}

export function generateInitialReel(gameSettings: any): string[] {
  const reel: string[] = [];
  gameSettings.Symbols.forEach(symbol => {
    const count = symbol.reelInstance[0] || 0; // Using reelInstance[0] for frequency
    for (let j = 0; j < count; j++) {
      reel.push(symbol.Id);
    }
  });

  shuffleArray(reel);

  return reel;
}

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function sendInitData(gameInstance: SLONE) {
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
export function makeResultJson(gameInstance: SLONE) {
  try {
    const { settings, playerData } = gameInstance;
    const credits = gameInstance.getPlayerData().credits
    const Balance = credits.toFixed(2)
    const sendData = {
      gameData: {
        resultSymbols: settings.resultSymbolMatrix,
        isFreeSpin: settings.isFreeSpin,
        freeSpinCount: settings.freeSpinCount
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

function getNonSpecialSymbols(symbols: Symbol[]): Symbol[] {
  return symbols.filter(symbol => !symbol.isSpecial && symbol.Id !== 0)
    .sort((a, b) => a.payout - b.payout);
}

function findNextSymbol(currentSymbol: Symbol, levelUp: number, nonSpecialSymbols: Symbol[]): Symbol {
  const currentIndex = nonSpecialSymbols.findIndex(s => s.Id === currentSymbol.Id);
  if (currentIndex === -1) return currentSymbol; // If not found, return the current symbol

  const targetIndex = Math.min(currentIndex + levelUp, nonSpecialSymbols.length - 1);
  return nonSpecialSymbols[targetIndex];
}

export function checkForLevelUp(gameInstance: SLONE): LevelUpResult {
  try {
    const { resultSymbolMatrix, Symbols, levelUp } = gameInstance.settings;
    const resultSymbolIndex = resultSymbolMatrix[0]
    const resultSymbol = Symbols[resultSymbolIndex];

    // Check if the result symbol is eligible for level up
    if (resultSymbol.isSpecial || resultSymbol.Id === 0) {
      return { level: 0, isLevelUp: false };
    }

    const nonSpecialSymbols = getNonSpecialSymbols(Symbols);
    const { levelProbs, level } = levelUp;

    const idx = getRandomIndex(levelProbs);
    const levelUpAmount = level[idx];

    if (levelUpAmount === 0) {
      return { level: 0, isLevelUp: false };
    }

    const newSymbol = findNextSymbol(resultSymbol, levelUpAmount, nonSpecialSymbols);

    return {
      isLevelUp: newSymbol.Id !== resultSymbol.Id,
      level: newSymbol.Id
    };
  } catch (error) {
    console.error("Error in checkForLevelUp:", error);
    return { level: 0, isLevelUp: false };
  }
}

//NOTE: for booster
function getSimpleMultiplier(multipliers: number[], multiplierProb: number[]): number {
  const idx = getRandomIndex(multiplierProb);
  return multipliers[idx];
}

//NOTE: for booster
function getExhaustiveMultipliers(multipliers: number[], multiplierProb: number[]): number[] {
  const allMultipliers: number[] = [];
  const usedIndices = new Set<number>();
  while (true) {
    const index = getRandomIndex(multiplierProb);
    if (usedIndices.has(index)) {
      break;
    }
    usedIndices.add(index);
    allMultipliers.push(multipliers[index]);
  }
  return allMultipliers;
}

//NOTE: check for booster feature (multiplier)
export function checkForBooster(gameInstance: SLONE): BoosterResult {
  try {
    if(gameInstance.settings.resultSymbolMatrix[0] === 0) return { type: 'NONE', multipliers: [] };

    const { typeProbs, multiplier, multiplierProbs } = gameInstance.settings.booster;
    const boosterType = getRandomIndex(typeProbs);

    switch (boosterType) {
      case 0:
        return { type: 'NONE', multipliers: [] };
      case 1:
        if (gameInstance.settings.booster.isEnabledSimple) {
          return {
            type: 'SIMPLE',
            multipliers: [getSimpleMultiplier(multiplier, multiplierProbs)],
          };
        } else {
          return {
            type: 'SIMPLE',
            multipliers: []
          }
        }
      case 2:
        if (gameInstance.settings.booster.isEnabledExhaustive) {
          return {
            type: 'EXHAUSTIVE',
            multipliers: getExhaustiveMultipliers(multiplier, multiplierProbs),
          };
        } else {
          return {
            type: 'EXHAUSTIVE',
            multipliers: []
          }
        }
      default:
        return { type: 'NONE', multipliers: [] };
    }
  } catch (err) {
    console.error("Error checking for booster:", err);
    return { type: 'NONE', multipliers: [] };
  }
}


export function calculatePayout(gameInstance: SLONE): number {
  try {

    let payout = 0;
    //NOTE: check for level up before scatter
    const { level: newIndex, isLevelUp } = checkForLevelUp(gameInstance);
    if (isLevelUp) {
      gameInstance.settings.resultSymbolMatrix[0] = newIndex
      console.log("levelup", { newIndex, isLevelUp });
      console.log("new result matrix ", gameInstance.settings.resultSymbolMatrix);
    }


    const symbol = gameInstance.settings.Symbols.find(sym => sym.Id === gameInstance.settings.resultSymbolMatrix[0]);
    if (!symbol) {
      throw new Error(`Symbol with Id ${gameInstance.settings.resultSymbolMatrix[0]} not found.`);
    }



    //NOTE: scatter
    switch (symbol.Name) {
      case "ScatterBlue":
        //TODO:
        //  - start with 5 lives 
        //    - increment or decrement lives as per symbols
        //    -  

        gameInstance.settings.isFreeSpin = true
        gameInstance.settings.freeSpinCount = 5
        gameInstance.settings.freeSpinType = "BLUE"
        let lives: number = 5
        let totalPayout: number = 0

        while (lives > 0) {
          const index = getRandomIndex(gameInstance.settings.scatterBlue.symbolsProbs)
          const symbol = gameInstance.settings.Symbols[index]

          console.log("symbol", symbol.Id);
          lives += symbol.freeSpinCount
          --lives
          gameInstance.settings.freeSpinCount = lives
          console.log("lives", lives);
          const payout = symbol.payout * gameInstance.settings.BetPerLines
          console.log("payout", payout);
          totalPayout += payout
        }
        gameInstance.playerData.currentWining = totalPayout
        gameInstance.playerData.haveWon += gameInstance.playerData.currentWining


        gameInstance.settings.isFreeSpin = false
        gameInstance.settings.freeSpinCount = 0
        gameInstance.settings.freeSpinType = ""
        break;
      case "ScatterPurple":
        //TODO:
        break;

      default:
        const multiplierResponse = checkForBooster(gameInstance)
        if (multiplierResponse.type === "NONE") {
          console.log("multipliers", multiplierResponse);
          payout = symbol.payout * gameInstance.settings.BetPerLines;
          gameInstance.playerData.currentWining = payout
        } else {
          //sum of multipliers
          const multiplier = multiplierResponse.multipliers.reduce((a, b) => a + b, 0);
          console.log("multipliers", multiplierResponse, multiplier);
          payout = symbol.payout * gameInstance.settings.BetPerLines * multiplier;
          gameInstance.playerData.currentWining = payout
        }

        if (payout > 0 && !gameInstance.settings.isFreeSpin) {
          gameInstance.playerData.currentWining = payout
          gameInstance.playerData.haveWon += gameInstance.playerData.currentWining
        }
        break;


    }

    console.log("Total Payout for:", gameInstance.getPlayerData().username, "" + gameInstance.playerData.currentWining);

    gameInstance.updatePlayerBalance(gameInstance.playerData.currentWining)
    makeResultJson(gameInstance)

  } catch (error) {
    console.error("Error calculating payout:", error.message);
    return 0;
  }
}



function getRandomIndex(probArray: number[]): number {
  const totalWeight = probArray.reduce((sum, prob) => sum + prob, 0);
  const randomNum = Math.random() * totalWeight;

  let cumulativeWeight = 0;
  for (let i = 0; i < probArray.length; i++) {
    cumulativeWeight += probArray[i];
    if (randomNum < cumulativeWeight) {
      return i;
    }
  }
  return probArray.length - 1; // Fallback to last index
}
