
import { Socket } from "socket.io";
import { middleware } from "../../utils/middleware";
import { GData } from "../Global.";
import { bonusGame } from "./extraBonusGames";
import { sendInitdata, RandomResultGenerator } from "./slotDataInit";
import { WinData, CheckResult } from "./slotResults";
import { GameSettings, WildSymbol, PlayerData, winning, specialIcons, bonusGameType, ResultType } from "./slotTypes";
import { convertSymbols, combineUniqueSymbols, removeRecurringIndexSymbols, makePayLines } from "./slotUtils";


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


  initiate: async (playerSkt: Socket, GameData: {}, clientID: string) => {
    // console.log(slotGameSettings.currentGamedata, "fullPayTable")
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
    sendInitdata(playerSkt, clientID);
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

  paylines: null,
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
