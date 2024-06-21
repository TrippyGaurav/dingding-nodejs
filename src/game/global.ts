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
import { CheckResult, WinData } from "./slotResults";
import { bonusGame } from "./bonusResults";
import { middleware } from "../utils/middleware";

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
    // game: new bonusGame(5),
  },
  currentBet: 5,
  startGame: false,
  gamble: {
    game: null,
    maxCount: 1,
    start: false,
  },
  reels: [[]],

  initiate: async (GameData: any, clientID: string) => {
    gameSettings.bonusPayTable = [];
    gameSettings.scatterPayTable = [];
    gameSettings.Symbols = [];
    gameSettings.Weights = [];
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

    gameSettings.currentGamedata = gameData[0];

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
  currentWining: 5,
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
    if (element.useWildSub || element.multiplier?.length > 0) {
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
    return;
  }

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
  gameSettings._winData = new WinData(clientID);
  gameSettings.bonus.start = false;
  new RandomResultGenerator();
  new CheckResult(clientID);
}
export function checkforMoolah(clientID: string) {
  gameSettings.tempReels = gameSettings.reels;
  const lastWinData = gameSettings._winData;
  lastWinData.winningSymbols = combineUniqueSymbols(
    removeRecurringIndexSymbols(lastWinData.winningSymbols)
  );
  const yValues = lastWinData.winningSymbols.map((str) => {
    const [, y] = str.split(",").map(Number);
    return y;
  });
  console.log(yValues);

  // new CheckResult(clientID);
}
function recursionCheck(xIndex: number) {
  for (let i = gameSettings.matrix.y - 2; i > 0; i--) {
    {
      if (gameSettings.resultSymbolMatrix[xIndex][i] == "") {
      }
    }
  }
}
function getLastindex(reelIndex: number, index: number, reel: number[][]) {
  if (index - 1 < 0)
    return reel[reelIndex][gameSettings.tempReels[reelIndex].length - 1];
  else return gameSettings.tempReels[reelIndex][index - 1];
}
