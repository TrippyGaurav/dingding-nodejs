"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentRTP = exports.gameWining = exports.UiInitData = exports.slotGameSettings = void 0;
const slotDataInit_1 = require("./slotDataInit");
const slotResults_1 = require("./slotResults");
const slotUtils_1 = require("./slotUtils");
exports.slotGameSettings = {
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
    wildSymbol: {},
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
    initiate: (playerSkt, GameData, clientID) => __awaiter(void 0, void 0, void 0, function* () {
        // console.log(slotGameSettings.currentGamedata, "fullPayTable")
        // console.log(GameData)
        exports.slotGameSettings.bonusPayTable = [];
        exports.slotGameSettings.scatterPayTable = [];
        exports.slotGameSettings.Symbols = [];
        exports.slotGameSettings.Weights = [];
        exports.slotGameSettings._winData = new slotResults_1.WinData();
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
        exports.slotGameSettings.currentGamedata = GameData[0] || GameData;
        exports.slotGameSettings.currentGamedata.Symbols.forEach((element) => {
            if (element.Name == "Bonus") {
                exports.slotGameSettings.bonus.id = element.Id;
            }
        });
        initSymbols();
        exports.UiInitData.paylines = (0, slotUtils_1.convertSymbols)(exports.slotGameSettings.currentGamedata.Symbols);
        exports.slotGameSettings.startGame = true;
        (0, slotUtils_1.makePayLines)();
        (0, slotDataInit_1.sendInitdata)(playerSkt, clientID);
    }),
};
function initSymbols() {
    var _a, _b;
    for (let i = 0; i < (exports.slotGameSettings === null || exports.slotGameSettings === void 0 ? void 0 : exports.slotGameSettings.currentGamedata.Symbols.length); i++) {
        exports.slotGameSettings.Symbols.push((_a = exports.slotGameSettings === null || exports.slotGameSettings === void 0 ? void 0 : exports.slotGameSettings.currentGamedata.Symbols[i].Id) === null || _a === void 0 ? void 0 : _a.toString());
        exports.slotGameSettings.Weights.push((_b = exports.slotGameSettings.currentGamedata.Symbols[i]) === null || _b === void 0 ? void 0 : _b.weightedRandomness);
    }
}
exports.UiInitData = {
    paylines: null,
    spclSymbolTxt: [],
    AbtLogo: {
        logoSprite: "https://iili.io/JrMCqPf.png",
        link: "https://dingding-game.vercel.app/login",
    },
    ToULink: "https://dingding-game.vercel.app/login",
    PopLink: "https://dingding-game.vercel.app/login",
};
exports.gameWining = {
    winningSymbols: undefined,
    WinningLines: undefined,
    TotalWinningAmount: 0,
    shouldFreeSpin: undefined,
    freeSpins: 0,
    currentBet: 0,
};
exports.getCurrentRTP = {
    playerWon: 0,
    playerTotalBets: 0,
};
