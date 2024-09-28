import { convertSymbols, UiInitData } from "../../Utils/gameUtils";
import { WinData } from "../BaseSlotGame/WinData";
import { SLONE } from "./OneOfAKindBase";

interface BoosterResult {
  type: 'NONE' | 'SIMPLE' | 'EXHAUSTIVE';
  multipliers: number[];
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

function getSimpleMultiplier(multipliers: number[], multiplierProb: number[]): number {
  const idx = getRandomIndex(multiplierProb);
  return multipliers[idx];
}

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

//NOTE: check for booster
export function checkForBooster(gameInstance: SLONE): BoosterResult {
  try {
    const { typeProb, multiplier, multiplierProb } = gameInstance.settings.booster;
    const boosterType = getRandomIndex(typeProb);

    switch (boosterType) {
      case 0:
        return { type: 'NONE', multipliers: [] };
      case 1:
        return {
          type: 'SIMPLE',
          multipliers: [getSimpleMultiplier(multiplier, multiplierProb)],
        };
      case 2:
        return {
          type: 'EXHAUSTIVE',
          multipliers: getExhaustiveMultipliers(multiplier, multiplierProb),
        };
      default:
        return { type: 'NONE', multipliers: [] };
    }
  } catch (err) {
    console.error("Error checking for booster:", err);
    return { type: 'NONE', multipliers: [] };
  }
}


export function calculatePayout(gameInstance: SLONE, symbolId: number): number {
  try {
    const symbol = gameInstance.settings.Symbols.find(sym => sym.Id === symbolId);
    if (!symbol) {
      throw new Error(`Symbol with Id ${symbolId} not found.`);
    }


    let payout = 0;
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
