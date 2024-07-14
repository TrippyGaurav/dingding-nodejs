
import { middleware } from "../../utils/middleware";
import { GData } from "../Global.";
import { bonusGame } from "./extraBonusGames";
import { sendInitdata, RandomResultGenerator } from "./slotDataInit";
import { WinData, CheckResult } from "./slotResults";
import { GameSettings, WildSymbol, PlayerData, winning, specialIcons, bonusGameType, ResultType } from "./slotTypes";
import { convertSymbols, combineUniqueSymbols, removeRecurringIndexSymbols } from "./slotUtils";


export const slotGameSettings: GameSettings = {
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
        defaultAmount: [],
        symbolsCount: [],
        increaseValue: []
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
  //The two variables are just for simulation.
  noOfBonus: 0,
  noOfFreeSpins: 0,
  totalBonuWinAmount: [],
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
  currentLines: 0,
  BetPerLines: 0,
  startGame: false,
  gamble: {
    game: null,
    maxCount: 1,
    start: false,
  },
  reels: [[]],

  initiate: async (GameData: {}, clientID: string) => {
    console.log(slotGameSettings.currentGamedata, "fullPayTable")
    // console.log(GameData)
    slotGameSettings.bonusPayTable = [];
    slotGameSettings.scatterPayTable = [];
    slotGameSettings.Symbols = [];
    slotGameSettings.Weights = [];
    slotGameSettings._winData = new WinData();
    // try {
    //   const resp = await fetch(
    //     "https://664c355635bbda10987f44ff.mockapi.io/api/gameId/" + GameID
    //   );
    //   const data = await resp.json();
    //   if (data == "Not found") {
    //     // Alerts(clientID, "Invalid Game ID");
    //     getClient(clientID).sendError("404", "GAMENOTFOUND");
    //     gameSettings.startGame = false;
    //     return;
    //   }
    //   gameSettings.currentGamedata = data;
    //   // const currentGameData=gameData.filter((element)=>element.id==GameID)
    // } catch (error) {
    //   getClient(clientID).sendError("404", "NETWORK ERROR");
    //   return;
    // }

    // const currentGameData=gameData.filter((element)=>element.id==GameID)

    slotGameSettings.currentGamedata = GameData[0] || GameData;


    slotGameSettings.currentGamedata.Symbols.forEach((element) => {
      if (element.Name == "Bonus") {
        slotGameSettings.bonus.id = element.Id
      }

    })

    initSymbols();
    UiInitData.paylines = convertSymbols(slotGameSettings.currentGamedata.Symbols);
    slotGameSettings.startGame = true;

    makePayLines();
    sendInitdata(clientID);
  },
};

function initSymbols() {
  for (let i = 0; i < slotGameSettings?.currentGamedata.Symbols.length; i++) {
    slotGameSettings.Symbols.push(
      slotGameSettings?.currentGamedata.Symbols[i].Id?.toString()
    );
    slotGameSettings.Weights.push(
      slotGameSettings.currentGamedata.Symbols[i]?.weightedRandomness
    );
  }
}



export const UiInitData = {

  paylines: convertSymbols(slotGameSettings.currentGamedata),
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

  if (line.length != slotGameSettings.matrix.x) {
    let lengthToAdd = slotGameSettings.matrix.x - line.length;
    for (let i = 0; i < lengthToAdd; i++) line.push("any");
  }

  slotGameSettings.payLine.push({
    line: line,
    pay: pay,
    freeSpins: freeSpins,
  });
}

export function makePayLines() {
  slotGameSettings.currentGamedata.Symbols.forEach((element) => {
    if (element.useWildSub || (element.Name == "FreeSpin") || (element.Name == "Scatter")) {
      element.multiplier?.forEach((item, index) => {
        addPayLineSymbols(element.Id?.toString(), 5 - index, item[0], item[1]);
      });
    } else {
      handleSpecialSymbols(element);
    }
  });
}

function handleSpecialSymbols(symbol) {
  slotGameSettings.bonusPayTable = [];
  slotGameSettings.scatterPayTable = [];

  switch (symbol.Name) {
    case specialIcons.jackpot:
      slotGameSettings.jackpot.symbolName = symbol.Name;
      slotGameSettings.jackpot.symbolId = symbol.Id;
      slotGameSettings.jackpot.symbolsCount = symbol.symbolsCount;
      slotGameSettings.jackpot.defaultAmount = symbol.defaultAmount;
      slotGameSettings.jackpot.increaseValue = symbol.increaseValue;
      break;
    case specialIcons.wild:
      slotGameSettings.wildSymbol.SymbolName = symbol.Name;
      slotGameSettings.wildSymbol.SymbolID = symbol.Id;
      slotGameSettings.useWild = true;
      break;
    case specialIcons.scatter:
      slotGameSettings.scatterPayTable.push({
        symbolCount: symbol.count,
        symbolID: symbol.Id,
        pay: symbol.pay,
        freeSpins: symbol.freeSpin,
      });
      slotGameSettings.useScatter = true;
      break;
    case specialIcons.bonus:
      slotGameSettings.bonusPayTable.push({
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
  // console.log(gameSettings._winData, ":gameSettings._winData");

  if (
    slotGameSettings.currentGamedata.bonus.isEnabled &&
    slotGameSettings.currentGamedata.bonus.type == bonusGameType.tap
  )
    slotGameSettings.bonus.game = new bonusGame(
      slotGameSettings.currentGamedata.bonus.noOfItem,
      clientID
    );


    GData.playerSocket.deductPlayerBalance(slotGameSettings.currentBet);
  // TODO : Middle ware goes here
  (async () => {
    await middleware();
  })();
 
  slotGameSettings.tempReels = [[]];
  slotGameSettings.bonus.start = false;

  new RandomResultGenerator();
  const result = new CheckResult();
  result.makeResultJson(ResultType.normal);
}

export function startFreeSpin() {
  console.log(
    "____----Started FREE SPIN ----_____" + " :::  FREE SPINSS ::::",
    slotGameSettings._winData.freeSpins
  );
  GData.playerSocket.sendMessage("StartedFreeSpin", {});
  slotGameSettings.freeSpinStarted = true;
  for (let i = 0; i <= slotGameSettings._winData.freeSpins; i++) {
    slotGameSettings.bonus.start = false;
    new RandomResultGenerator();
    new CheckResult();
    console.log(
      "FREE SPINS LEFTTT ::::" + (slotGameSettings._winData.freeSpins - i)
    );
  }
  slotGameSettings._winData.freeSpins = 0;

  GData.playerSocket.sendMessage("StoppedFreeSpins", {});
  slotGameSettings.freeSpinStarted = false;

  console.log("____----Stopped FREE SPIN ----_____");
}
export function checkforMoolah() {
  console.log("_______-------CALLED FOR CHECK FOR MOOLAHHHH-------_______");


  slotGameSettings.tempReels = slotGameSettings.reels;
  const lastWinData = slotGameSettings._winData;
  lastWinData.winningSymbols = combineUniqueSymbols(
    removeRecurringIndexSymbols(lastWinData.winningSymbols)
  );
  const index = lastWinData.winningSymbols.map((str) => {
    const index: { x, y } = str.split(",").map(Number);
    return index;
  });
  console.log("Winning Indexes " + index);
  let matrix = [];
  matrix = slotGameSettings.resultSymbolMatrix;
  index.forEach(element => {
    matrix[element[1]][element[0]] = null;

  })
  const movedArray = cascadeMoveTowardsNull(matrix);

  let transposed = transposeMatrix(movedArray);
  let iconsToFill: number[][] = []
  for (let i = 0; i < transposed.length; i++) {
    let row = []
    for (let j = 0; j < transposed[i].length; j++) {
      if (transposed[i][j] == null) {
        let index = (slotGameSettings.resultReelIndex[i] + j + 2) % slotGameSettings.tempReels[i].length;
        transposed[i][j] = slotGameSettings.tempReels[i][index];
        row.unshift(slotGameSettings.tempReels[i][index]);
      }

    }
    if (row.length > 0)
      iconsToFill.push(row);
  }


  matrix = transposeMatrix(transposed);
  // matrix.pop();
  // matrix.pop();
  // matrix.pop();
  // matrix.push([ '1', '2', '3', '4', '5' ])
  // matrix.push([ '1', '1', '1', '1', '6' ])
  // matrix.push([ '0', '0', '0', '0', '0' ])
  console.log("iconsTofill", iconsToFill);
  slotGameSettings.resultSymbolMatrix = matrix;

  const result = new CheckResult();
  result.makeResultJson(ResultType.moolah, iconsToFill);
}

function getLastindex(reelIndex: number, index: number) {
  if (index >= slotGameSettings.tempReels[reelIndex].length)
    if (index >= slotGameSettings.tempReels[reelIndex].length)
      index = index - slotGameSettings.tempReels[reelIndex].length;

  console.log("index __", index);


  let Index = index - 1;
  console.log("Changed Index " + Index);
  if (Index < 0) {
    Index = slotGameSettings.tempReels[reelIndex].length - 1;
    console.log("Reel Lenght " + slotGameSettings.tempReels[reelIndex].length + " Changed value below Zeros " + Index);
    return slotGameSettings.tempReels[reelIndex][Index]
  }
  else return slotGameSettings.tempReels[reelIndex][Index];
}


function cascadeMoveTowardsNull(arr: (string | null)[][]): (string | null)[][] {
  if (arr.length === 0 || arr[0].length === 0) return arr;
  const numRows = arr.length;
  const numCols = arr[0].length;
  
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


