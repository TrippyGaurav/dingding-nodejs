"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseSettings = void 0;
const newGambleGame_1 = require("../newGambleGame");
exports.baseSettings = {
    currentGamedata: {
        id: "",
        matrix: { x: 0, y: 0 },
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
                increaseValue: [],
                reelInstance: [], // Ensure reelInstance is initialized
            },
        ],
        bonus: {
            isEnabled: false,
            type: "",
            noOfItem: 0,
            payOut: [], // Ensure payOut is initialized
            payOutProb: [], // Ensure payOutProb is initialized
            payTable: [], // Ensure payTable is initialized
        },
        bets: [], // Ensure bets is initialized
        linesCount: 0, // Ensure linesCount is initialized
    },
    tempReels: [[]],
    payLine: [],
    useScatter: false,
    wildSymbol: {
        SymbolName: "-1",
        SymbolID: -1,
        useWild: false
    },
    Symbols: [],
    Weights: [],
    resultSymbolMatrix: [],
    lineData: [],
    fullPayTable: [],
    _winData: undefined,
    resultReelIndex: [],
    noOfBonus: 0,
    totalBonuWinAmount: [],
    jackpot: {
        symbolName: "",
        symbolsCount: 0,
        symbolId: 0,
        defaultAmount: 0,
        increaseValue: 0,
        useJackpot: false,
    },
    bonus: {
        start: false,
        stopIndex: -1,
        game: null,
        id: -1,
        symbolCount: -1,
        pay: -1,
        useBonus: false,
    },
    freeSpin: {
        symbolID: "-1",
        freeSpinMuiltiplier: [],
        freeSpinStarted: false,
        freeSpinsAdded: false,
        freeSpinCount: 0,
        noOfFreeSpins: 0,
        useFreeSpin: false,
    },
    scatter: {
        symbolID: "-1",
        multiplier: [],
        useScatter: false
    },
    currentBet: 0,
    currentLines: 0,
    BetPerLines: 0,
    startGame: false,
    gamble: new newGambleGame_1.gambleCardGame(this),
    reels: [[]],
    currentMoolahCount: 0,
};
