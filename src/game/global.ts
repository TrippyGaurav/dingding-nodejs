import { RandomResultGenerator, sendInitdata } from "./slotDataInit";
import { gameData } from "./testData";
import {
  GameSettings,
  PlayerData,
  WildSymbol,
  bonusGameType,
  combineUniqueSymbols,
  convertSymbols,
  removeRecurringIndexSymbols,
  specialIcons,
  winning,
} from "./gameUtils";
import { getClient } from "../user/user";
import exp from "constants";
import { CheckResult, ResultType, WinData } from "./slotResults";
import { bonusGame } from "./bonusResults";
import { middleware } from "../utils/middleware";
import { log } from "console";

export const gameSettings: GameSettings = {
  currentGamedata: {
    id: "",
    linesApiData: [],
    Symbols: [
      {
        Name: "",
        Id: null,
        weightedRandomness: 0,
        useWildSub: false,
        multiplier: [],
      },
    ],
  },
  tempReels: [[]],
  matrix: { x: 5, y: 3 },
  payLine: [],
  scatterPayTable: [],
  bonusPayTable: [],
  useScatter: false,
  useWild: false,
  wildSymbol: {} as WildSymbol,
  Symbols: [],
  Weights: [],
  resultSymbolMatrix: [],
  lineData: [],
  fullPayTable: [],
  _winData: undefined,
  freeSpinStarted: false,
  resultReelIndex: [],
  jackpot: {
    symbolName: "",
    symbolsCount: 0,
    symbolId: 0,
    defaultAmount: 0,
    increaseValue: 0,
  },
  bonus: {
    start: false,
    stopIndex: -1,
    game: null,
    id: -1,
    // game: new bonusGame(5),
  },
  currentBet: 0,
  currentLines : 0 ,
  BetPerLines : 0,
  startGame: false,
  gamble: {
    game: null,
    maxCount: 1,
    start: false,
  },
  reels: [[]],

  initiate: async (GameData: {}, clientID: string) => {
console.log(GameData)
    gameSettings.bonusPayTable = [];
    gameSettings.scatterPayTable = [];
    gameSettings.Symbols = [];
    gameSettings.Weights = [];
    gameSettings._winData = new WinData(clientID);


    gameSettings.currentGamedata = GameData[0] || GameData;

    // gameSettings.currentBet = 
    gameSettings.currentGamedata.Symbols.forEach((element) => {
      if (element.Name == "Bonus") {
        gameSettings.bonus.id = element.Id;
      }
    });


    initSymbols();
    UiInitData.paylines = convertSymbols(gameSettings.currentGamedata.Symbols);
    gameSettings.startGame = true;

    makePayLines();
    sendInitdata(clientID);
  },
};

function initSymbols() {
  for (let i = 0; i < gameSettings?.currentGamedata.Symbols.length; i++) {
    gameSettings.Symbols.push(
      gameSettings?.currentGamedata.Symbols[i].Id?.toString()
    );
    gameSettings.Weights.push(
      gameSettings.currentGamedata.Symbols[i]?.weightedRandomness
    );
  }
}

export const playerData: PlayerData = {
  Balance: 100000,
  haveWon: 0,
  currentWining: 0,
  playerId: "",
  // haveUsed: 0
};

export const UiInitData = {
  paylines: convertSymbols(gameSettings.currentGamedata.Symbols),
  spclSymbolTxt: [],
  AbtLogo: {
    logoSprite: "https://iili.io/JrMCqPf.png",
    link: "https://dingding-game.vercel.app/login",
  },
  ToULink: "https://dingding-game.vercel.app/login",
  PopLink: "https://dingding-game.vercel.app/login",
};

export let gameWining: winning = {
  winningSymbols: undefined,
  WinningLines: undefined,
  TotalWinningAmount: 0,
  shouldFreeSpin: undefined,
  freeSpins: 0,
  currentBet: 0,
};
export const getCurrentRTP = {
  playerWon: 0,
  playerTotalBets: 0,
};

export function addPayLineSymbols(
  symbol: string,
  repetition: number,
  pay: number,
  freeSpins: number
): void {
  const line: string[] = Array(repetition).fill(symbol); // Create an array with 'repetition' number of 'symbol'

  if (line.length != gameSettings.matrix.x) {
    let lengthToAdd = gameSettings.matrix.x - line.length;
    for (let i = 0; i < lengthToAdd; i++) line.push("any");
  }

  gameSettings.payLine.push({
    line: line,
    pay: pay,
    freeSpins: freeSpins,
  });
}

export function makePayLines() {
  gameSettings.currentGamedata.Symbols.forEach((element) => {
    if (element.useWildSub || (element.Name=="FreeSpin") || (element.Name=="Scatter")) {
      element.multiplier?.forEach((item, index) => {
        addPayLineSymbols(element.Id?.toString(), 5 - index, item[0], item[1]);
      });
    } else {
      handleSpecialSymbols(element);
    }
  });
}

function handleSpecialSymbols(symbol) {
  gameSettings.bonusPayTable = [];
  gameSettings.scatterPayTable = [];

  switch (symbol.Name) {
    case specialIcons.jackpot:
      gameSettings.jackpot.symbolName = symbol.Name;
      gameSettings.jackpot.symbolId = symbol.Id;
      gameSettings.jackpot.symbolsCount = symbol.symbolsCount;
      gameSettings.jackpot.defaultAmount = symbol.defaultAmount;
      gameSettings.jackpot.increaseValue = symbol.increaseValue;
      break;
    case specialIcons.wild:
      gameSettings.wildSymbol.SymbolName = symbol.Name;
      gameSettings.wildSymbol.SymbolID = symbol.Id;
      gameSettings.useWild = true;
      break;
    case specialIcons.scatter:
      gameSettings.scatterPayTable.push({
        symbolCount: symbol.count,
        symbolID: symbol.Id,
        pay: symbol.pay,
        freeSpins: symbol.freeSpin,
      });
      gameSettings.useScatter = true;
      break;
    case specialIcons.bonus:
      gameSettings.bonusPayTable.push({
        symbolCount: symbol.symbolCount,
        symbolID: symbol.Id,
        pay: symbol.pay,
        highestPayMultiplier: symbol.highestMultiplier,
      });
      break;
    default:
      break;
  }
}

//CHECKMOOLAH
export function spinResult(clientID: string) {
  console.log(gameSettings._winData, ":gameSettings._winData");

  if (
    gameSettings.currentGamedata.bonus.isEnabled &&
    gameSettings.currentGamedata.bonus.type == bonusGameType.tap
  )
    gameSettings.bonus.game = new bonusGame(
      gameSettings.currentGamedata.bonus.noOfItem,
      clientID
    );

  // if(playerData.Balance < gameWining.currentBet)
  if (playerData.Balance < gameSettings.currentBet) {
    // Alerts(clientID, "Low Balance");
    console.warn("LOW BALANCE ALErt");
    console.error("Low Balance ALErt");
    return;
  }

  console.log("CALLED SPINNN" + playerData.Balance);

  // TODO : Middle ware goes here
  (async () => {
    await middleware();
  })();
  //minus the balance

  //TODO:To get the user information

  console.log("CurrentBet : " + gameSettings.currentBet);

  playerData.Balance -= gameSettings.currentBet;
  gameSettings.tempReels = [[]];
  console.log("player balance:", playerData.Balance);
  console.log("player havewon:", playerData.haveWon);
  gameSettings.bonus.start = false;
  console.log("CALLEDD");

  new RandomResultGenerator();
  const result = new CheckResult();
  result.makeResultJson(ResultType.normal);


  // playerData.Balance -= gameSettings.currentBet;
  // gameSettings.tempReels = [[]];
  // console.log("player balance:", playerData.Balance);
  // console.log("player havewon:", playerData.haveWon);
  // gameSettings.bonus.start = false;
  // console.log("CALLEDD");

  // new RandomResultGenerator();
  // const result = new CheckResult();
  // result.makeResultJson(ResultType.normal);
}

export function startFreeSpin() {
  console.log(
    "____----Started FREE SPIN ----_____" + " :::  FREE SPINSS ::::",
    gameSettings._winData.freeSpins
  );
  getClient(playerData.playerId).sendMessage("StartedFreeSpin", {});
  gameSettings.freeSpinStarted = true;
  for (let i = 0; i <= gameSettings._winData.freeSpins; i++) {
    gameSettings.bonus.start = false;
    new RandomResultGenerator();
    new CheckResult();
    console.log(
      "FREE SPINS LEFTTT ::::" + (gameSettings._winData.freeSpins - i)
    );
  }
  gameSettings._winData.freeSpins = 0;

  getClient(playerData.playerId).sendMessage("StoppedFreeSpins", {});
  gameSettings.freeSpinStarted = false;

  console.log("____----Stopped FREE SPIN ----_____");
}
export function checkforMoolah() {
  console.log("_______-------CALLED FOR CHECK FOR MOOLAHHHH-------_______");


  gameSettings.tempReels = gameSettings.reels;
  const lastWinData = gameSettings._winData;
  lastWinData.winningSymbols = combineUniqueSymbols(
    removeRecurringIndexSymbols(lastWinData.winningSymbols)
  );
  const index = lastWinData.winningSymbols.map((str) => {
    const index: { x, y } = str.split(",").map(Number);
    return index;
  });
  console.log("Winning Indexes " + index);
  let matrix = [];
  matrix = gameSettings.resultSymbolMatrix;
  index.forEach(element => {
    matrix[element[1]][element[0]] = null;

  })
  const movedArray = cascadeMoveTowardsNull(matrix);

  let transposed = transposeMatrix(movedArray);
  let iconsToFill:number[][]=[]
  for (let i = 0; i < transposed.length; i++) {
    let row=[]
    for (let j = 0; j < transposed[i].length; j++) {
      if (transposed[i][j] == null) {
        let index = (gameSettings.resultReelIndex[i] + j + 2) % gameSettings.tempReels[i].length;
        transposed[i][j] = gameSettings.tempReels[i][index];
        row.unshift(gameSettings.tempReels[i][index]);
      }

    }
    if(row.length>0)
    iconsToFill.push(row);
  }


  matrix = transposeMatrix(transposed);
  // matrix.pop();
  // matrix.pop();
  // matrix.pop();
  // matrix.push([ '1', '2', '3', '4', '5' ])
  // matrix.push([ '1', '1', '1', '1', '6' ])
  // matrix.push([ '0', '0', '0', '0', '0' ])
  console.log("iconsTofill",iconsToFill);
  gameSettings.resultSymbolMatrix=matrix;

  // index.forEach(element => {
  //   console.log("X : " + element[0] + " Y : " + element[1]);
  //   console.log("REEL LENGTH " + gameSettings.tempReels[element[0]].length);

  //   console.log("SYMBOL before  changing" + gameSettings.resultSymbolMatrix[element[1]][element[0]]);

  //   console.log(gameSettings.resultReelIndex);

  //   removeElement(gameSettings.tempReels, element[0], gameSettings.resultReelIndex[element[0]]);
  //   gameSettings.resultSymbolMatrix[element[1]][element[0]] = getLastindex(element[0], (gameSettings.resultReelIndex[element[0]] + element[1]));

  //   console.log("reel Lenght" + gameSettings.tempReels[element[0]].length + "  Changing Reel Index " + (gameSettings.resultReelIndex[element[0]] + element[1]));


  //   console.log("SYMBOL After changing " + gameSettings.resultSymbolMatrix[element[1]][element[0]]);
  // });

  const result = new CheckResult();
  result.makeResultJson(ResultType.moolah,iconsToFill);
}

function getLastindex(reelIndex: number, index: number) {
  if (index >= gameSettings.tempReels[reelIndex].length)
  if (index >= gameSettings.tempReels[reelIndex].length)
    index = index - gameSettings.tempReels[reelIndex].length;

  console.log("index __", index);


  let Index = index - 1;
  console.log("Changed Index " + Index);
  if (Index < 0) {
    Index = gameSettings.tempReels[reelIndex].length - 1;
    console.log("Reel Lenght " + gameSettings.tempReels[reelIndex].length + " Changed value below Zero " + Index);
    return gameSettings.tempReels[reelIndex][Index]
  }
  else return gameSettings.tempReels[reelIndex][Index];
}
function removeElement(
  arr: string[][],
  rowIndex: number,
  colIndex: number
): void {
  console.log("row : " + rowIndex + " col : " + colIndex);
  console.log("temp Reel " + gameSettings.tempReels[rowIndex]);
  console.log(arr[rowIndex].length);


  // if (rowIndex < 0 || rowIndex >= arr.length || colIndex < 0 || colIndex >= arr[rowIndex].length) {
  //     throw new Error('Invalid indices provided '+ rowIndex + " " + colIndex);
  // }

  // Remove the element at the specified indices
  arr[rowIndex].splice(colIndex, 1);

  // Shift elements to the left to fill the removed position
  for (let i = rowIndex; i < arr.length; i++) {
    for (let j = colIndex; j < arr[i].length; j++) {
      if (j + 1 < arr[i].length) {
        arr[i][j] = arr[i][j + 1];
      } else {
        // If we are at the last column, remove the last element
        arr[i].pop();
      }
    }
    for (let j = colIndex; j < arr[i].length; j++) {
      if (j + 1 < arr[i].length) {
        arr[i][j] = arr[i][j + 1];
      } else {
        // If we are at the last column, remove the last element
        arr[i].pop();
      }
    }
  }
}


function cascadeMoveTowardsNull(arr: (string | null)[][]): (string | null)[][] {
  // Check if the array is empty or if it has empty subarrays
  if (arr.length === 0 || arr[0].length === 0) return arr;

  // Determine the number of rows and columns
  const numRows = arr.length;
  const numCols = arr[0].length;

  // Create a new array to store the result
  let result: (string | null)[][] = Array.from({ length: numRows }, () => new Array(numCols).fill(null));

  for (let col = 0; col < numCols; col++) {
    let newRow = numRows - 1;

    // Place non-null elements starting from the bottom
    for (let row = numRows - 1; row >= 0; row--) {
      if (arr[row][col] !== null) {
        result[newRow][col] = arr[row][col];
        newRow--;
      }
    }

    // Fill the top positions with null if there are remaining positions
    for (let row = newRow; row >= 0; row--) {
      result[row][col] = null;
    }
  }

  return result;
}

function transposeMatrix(matrix) {
  let transposed = [];

  for (let i = 0; i < matrix[0].length; i++) {
    let newRow = [];
    for (let j = 0; j < matrix.length; j++) {
      newRow.push(matrix[j][i]);
    }
    transposed.push(newRow);
  }

  return transposed;

}



