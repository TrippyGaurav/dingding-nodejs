
import { UiInitData, slotGameSettings} from "./_global";
import { PayLines } from "./slotResults";
import { shuffleArray } from "./slotUtils";
import { bonusGameType } from "./slotTypes";
import { GData } from "../Global.";
import { bonusGame } from "./extraBonusGames";
import { PlayerData } from "../Global.";
export function sendInitdata(clientID: string) {
  // const matrix = generateMatrix(gameSettings.matrix.x, 18);
  gameDataInit();
  slotGameSettings.reels = generateInitialreel();
  if (
    slotGameSettings.currentGamedata.bonus.isEnabled &&
    slotGameSettings.currentGamedata.bonus.type == bonusGameType.spin
  )
    slotGameSettings.bonus.game = new bonusGame(
      slotGameSettings.currentGamedata.bonus.noOfItem,
      clientID
    );

  let specialSymbols = slotGameSettings.currentGamedata.Symbols.filter(
    (element) => !element.useWildSub
  );

  // for (let i = 0; i < specialSymbols.length; i++) {
  //   const strng =
  //     "Player has the right to start the slot machine without using their funds for a certain number of times. The size of the bet is determined by the";
  //   UiInitData.spclSymbolTxt.push(strng);
  // }

  const dataToSend = {
    GameData: {
      Reel: slotGameSettings.reels,
      // freeSpin: gameSettings.currentGamedata.Symbols[9],
      // Scatter: gameSettings.currentGamedata.Symbols[11],
      // Jackpot: gameSettings.currentGamedata.Symbols[12],
      Lines: slotGameSettings.currentGamedata.linesApiData,
      Bets: slotGameSettings.currentGamedata.bets,
      canSwitchLines: false,
      LinesCount: slotGameSettings.currentGamedata.linesCount,
      autoSpin: [1, 5, 10, 20],
    },
    BonusData:
      slotGameSettings.bonus.game != null
        ? slotGameSettings.bonus.game.generateData(
          slotGameSettings.bonusPayTable[0]?.pay
        )
        : [],
    UIData: UiInitData,
    PlayerData: PlayerData,
  };
  GData.playerSocket.sendMessage("InitData", dataToSend);
}

export class RandomResultGenerator {
  constructor() {
    let matrix: string[][] = [];
    let randomIndexArray: number[] = [];
    for (let j = 0; j < slotGameSettings.matrix.y; j++) {
      let row: string[] = [];
      for (let i = 0; i < slotGameSettings.matrix.x; i++) {
        if (j == 0) {
          let rowrandomIndex =
            Math.floor(Math.random() * (slotGameSettings.reels[i].length - 1 - 0)) +
            0;
          randomIndexArray.push(rowrandomIndex);
          row.push(slotGameSettings.reels[i][rowrandomIndex].toString());
        } else {
          let initialRandomIndex = randomIndexArray[i];
          let adjustedIndex = (initialRandomIndex + j) % slotGameSettings.reels[i].length;
          row.push(slotGameSettings.reels[i][adjustedIndex].toString());
        }
      }
      matrix.push(row);

    }
    slotGameSettings.resultReelIndex = randomIndexArray;
    console.log("indexs", randomIndexArray);
    console.log("gameSettings._winData.resultReelIndex", slotGameSettings.resultReelIndex);

    // matrix.pop();
    // matrix.pop();
    // matrix.pop();
    // matrix.push([ '1', '2', '3', '4', '5' ])
    // matrix.push([ '2', '13', '13', '13', '13' ])
    // matrix.push([ '1', '1', '1', '1', '6' ])

    slotGameSettings.resultSymbolMatrix = matrix;
    console.log("MATRIX " + matrix);

  }
  // Function to generate a random number based on weights
  randomWeightedIndex(weights: number[]): number {
    const totalWeight: number = weights.reduce((acc, val) => acc + val, 0);
    const randomNumber: number = Math.random() * totalWeight;
    let weightSum: number = 0;
    for (let i = 0; i < weights.length; i++) {
      weightSum += weights[i];
      if (randomNumber <= weightSum) {
        return i;
      }
    }
    // Default to last index if not found
    return weights.length - 1;
  }
}

function gameDataInit() {
  slotGameSettings.lineData = slotGameSettings.currentGamedata.linesApiData;
  // gameSettings.bonus.start = false;
  makeFullPayTable();
}

function generateInitialreel(): string[][] {
  let matrix: string[][] = [];
  for (let i = 0; i < slotGameSettings.matrix.x; i++) {
    let reel: string[] = [];

    slotGameSettings.currentGamedata.Symbols.forEach((element) => {
      for (let j = 0; j < element.reelInstance[i]; j++) {
        reel.push(element.Id.toString());
      }
    });

    shuffleArray(reel);
    matrix.push(reel);
  }

  return matrix;
}

function makeFullPayTable() {
  let payTable: PayLines[] = [];
  let payTableFull = [];

  slotGameSettings.payLine.forEach((pLine) => {
    payTable.push(
      new PayLines(
        pLine.line,
        pLine.pay,
        pLine.freeSpins,
        slotGameSettings.wildSymbol.SymbolName
      )
    );
  });
  for (let j = 0; j < payTable.length; j++) {
    payTableFull.push(payTable[j]);
    if (slotGameSettings.useWild) {
      let wildLines = payTable[j].getWildLines();
      wildLines.forEach((wl) => {
        payTableFull.push(wl);
      });
    }
  }

  slotGameSettings.fullPayTable = payTableFull;

}
