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
exports.getCurrentRTP = exports.gameWining = exports.UiInitData = exports.playerData = exports.gameSettings = void 0;
exports.addPayLineSymbols = addPayLineSymbols;
exports.makePayLines = makePayLines;
exports.spinResult = spinResult;
exports.startFreeSpin = startFreeSpin;
exports.checkforMoolah = checkforMoolah;
const slotDataInit_1 = require("./slotDataInit");
const gameUtils_1 = require("./gameUtils");
const userSocket_1 = require("../socket/userSocket");
const slotResults_1 = require("./slotResults");
const bonusResults_1 = require("./bonusResults");
const middleware_1 = require("../utils/middleware");
exports.gameSettings = {
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
    initiate: (GameData, clientID) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(exports.gameSettings.currentGamedata, "fullPayTable");
        // console.log(GameData)
        exports.gameSettings.bonusPayTable = [];
        exports.gameSettings.scatterPayTable = [];
        exports.gameSettings.Symbols = [];
        exports.gameSettings.Weights = [];
        exports.gameSettings._winData = new slotResults_1.WinData(clientID);
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
        exports.gameSettings.currentGamedata = GameData[0] || GameData;
        exports.gameSettings.currentGamedata.Symbols.forEach((element) => {
            if (element.Name == "Bonus") {
                exports.gameSettings.bonus.id = element.Id;
            }
        });
        initSymbols();
        exports.UiInitData.paylines = (0, gameUtils_1.convertSymbols)(exports.gameSettings.currentGamedata.Symbols);
        exports.gameSettings.startGame = true;
        makePayLines();
        (0, slotDataInit_1.sendInitdata)(clientID);
    }),
};
function initSymbols() {
    var _a, _b;
    for (let i = 0; i < (exports.gameSettings === null || exports.gameSettings === void 0 ? void 0 : exports.gameSettings.currentGamedata.Symbols.length); i++) {
        exports.gameSettings.Symbols.push((_a = exports.gameSettings === null || exports.gameSettings === void 0 ? void 0 : exports.gameSettings.currentGamedata.Symbols[i].Id) === null || _a === void 0 ? void 0 : _a.toString());
        exports.gameSettings.Weights.push((_b = exports.gameSettings.currentGamedata.Symbols[i]) === null || _b === void 0 ? void 0 : _b.weightedRandomness);
    }
}
exports.playerData = {
    Balance: 100000,
    haveWon: 0,
    currentWining: 0,
    playerId: "",
    // haveUsed: 0
};
exports.UiInitData = {
    paylines: (0, gameUtils_1.convertSymbols)(exports.gameSettings.currentGamedata),
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
function addPayLineSymbols(symbol, repetition, pay, freeSpins) {
    const line = Array(repetition).fill(symbol); // Create an array with 'repetition' number of 'symbol'
    if (line.length != exports.gameSettings.matrix.x) {
        let lengthToAdd = exports.gameSettings.matrix.x - line.length;
        for (let i = 0; i < lengthToAdd; i++)
            line.push("any");
    }
    exports.gameSettings.payLine.push({
        line: line,
        pay: pay,
        freeSpins: freeSpins,
    });
}
function makePayLines() {
    exports.gameSettings.currentGamedata.Symbols.forEach((element) => {
        var _a;
        if (element.useWildSub || (element.Name == "FreeSpin") || (element.Name == "Scatter")) {
            (_a = element.multiplier) === null || _a === void 0 ? void 0 : _a.forEach((item, index) => {
                var _a;
                addPayLineSymbols((_a = element.Id) === null || _a === void 0 ? void 0 : _a.toString(), 5 - index, item[0], item[1]);
            });
        }
        else {
            handleSpecialSymbols(element);
        }
    });
}
function handleSpecialSymbols(symbol) {
    exports.gameSettings.bonusPayTable = [];
    exports.gameSettings.scatterPayTable = [];
    switch (symbol.Name) {
        case gameUtils_1.specialIcons.jackpot:
            exports.gameSettings.jackpot.symbolName = symbol.Name;
            exports.gameSettings.jackpot.symbolId = symbol.Id;
            exports.gameSettings.jackpot.symbolsCount = symbol.symbolsCount;
            exports.gameSettings.jackpot.defaultAmount = symbol.defaultAmount;
            exports.gameSettings.jackpot.increaseValue = symbol.increaseValue;
            break;
        case gameUtils_1.specialIcons.wild:
            exports.gameSettings.wildSymbol.SymbolName = symbol.Name;
            exports.gameSettings.wildSymbol.SymbolID = symbol.Id;
            exports.gameSettings.useWild = true;
            break;
        case gameUtils_1.specialIcons.scatter:
            exports.gameSettings.scatterPayTable.push({
                symbolCount: symbol.count,
                symbolID: symbol.Id,
                pay: symbol.pay,
                freeSpins: symbol.freeSpin,
            });
            exports.gameSettings.useScatter = true;
            break;
        case gameUtils_1.specialIcons.bonus:
            exports.gameSettings.bonusPayTable.push({
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
function spinResult(clientID) {
    // console.log(gameSettings._winData, ":gameSettings._winData");
    if (exports.gameSettings.currentGamedata.bonus.isEnabled &&
        exports.gameSettings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.tap)
        exports.gameSettings.bonus.game = new bonusResults_1.bonusGame(exports.gameSettings.currentGamedata.bonus.noOfItem, clientID);
    // if(playerData.Balance < gameWining.currentBet)
    if (exports.playerData.Balance < exports.gameSettings.currentBet) {
        // Alerts(clientID, "Low Balance");
        (0, userSocket_1.getClient)(exports.playerData.playerId).sendMessage("low-balance", true);
        console.log(exports.playerData.Balance, "player balance");
        console.log(exports.gameSettings.currentBet, "currentbet");
        console.warn("LOW BALANCE ALErt");
        console.error("Low Balance ALErt");
        return;
    }
    console.log("CALLED SPINNN" + exports.playerData.Balance);
    // TODO : Middle ware goes here
    (() => __awaiter(this, void 0, void 0, function* () {
        yield (0, middleware_1.middleware)();
    }))();
    //minus the balance
    //TODO:To get the user information
    console.log("CurrentBet : " + exports.gameSettings.currentBet);
    exports.playerData.Balance -= exports.gameSettings.currentBet;
    exports.gameSettings.tempReels = [[]];
    console.log("player balance:", exports.playerData.Balance);
    console.log("player havewon:", exports.playerData.haveWon);
    exports.gameSettings.bonus.start = false;
    console.log("CALLEDD");
    new slotDataInit_1.RandomResultGenerator();
    const result = new slotResults_1.CheckResult();
    result.makeResultJson(slotResults_1.ResultType.normal);
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
function startFreeSpin() {
    console.log("____----Started FREE SPIN ----_____" + " :::  FREE SPINSS ::::", exports.gameSettings._winData.freeSpins);
    (0, userSocket_1.getClient)(exports.playerData.playerId).sendMessage("StartedFreeSpin", {});
    exports.gameSettings.freeSpinStarted = true;
    for (let i = 0; i <= exports.gameSettings._winData.freeSpins; i++) {
        exports.gameSettings.bonus.start = false;
        new slotDataInit_1.RandomResultGenerator();
        new slotResults_1.CheckResult();
        console.log("FREE SPINS LEFTTT ::::" + (exports.gameSettings._winData.freeSpins - i));
    }
    exports.gameSettings._winData.freeSpins = 0;
    (0, userSocket_1.getClient)(exports.playerData.playerId).sendMessage("StoppedFreeSpins", {});
    exports.gameSettings.freeSpinStarted = false;
    console.log("____----Stopped FREE SPIN ----_____");
}
function checkforMoolah() {
    console.log("_______-------CALLED FOR CHECK FOR MOOLAHHHH-------_______");
    exports.gameSettings.tempReels = exports.gameSettings.reels;
    const lastWinData = exports.gameSettings._winData;
    lastWinData.winningSymbols = (0, gameUtils_1.combineUniqueSymbols)((0, gameUtils_1.removeRecurringIndexSymbols)(lastWinData.winningSymbols));
    const index = lastWinData.winningSymbols.map((str) => {
        const index = str.split(",").map(Number);
        return index;
    });
    console.log("Winning Indexes " + index);
    let matrix = [];
    matrix = exports.gameSettings.resultSymbolMatrix;
    index.forEach(element => {
        matrix[element[1]][element[0]] = null;
    });
    const movedArray = cascadeMoveTowardsNull(matrix);
    let transposed = transposeMatrix(movedArray);
    let iconsToFill = [];
    for (let i = 0; i < transposed.length; i++) {
        let row = [];
        for (let j = 0; j < transposed[i].length; j++) {
            if (transposed[i][j] == null) {
                let index = (exports.gameSettings.resultReelIndex[i] + j + 2) % exports.gameSettings.tempReels[i].length;
                transposed[i][j] = exports.gameSettings.tempReels[i][index];
                row.unshift(exports.gameSettings.tempReels[i][index]);
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
    exports.gameSettings.resultSymbolMatrix = matrix;
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
    const result = new slotResults_1.CheckResult();
    result.makeResultJson(slotResults_1.ResultType.moolah, iconsToFill);
}
function getLastindex(reelIndex, index) {
    if (index >= exports.gameSettings.tempReels[reelIndex].length)
        if (index >= exports.gameSettings.tempReels[reelIndex].length)
            index = index - exports.gameSettings.tempReels[reelIndex].length;
    console.log("index __", index);
    let Index = index - 1;
    console.log("Changed Index " + Index);
    if (Index < 0) {
        Index = exports.gameSettings.tempReels[reelIndex].length - 1;
        console.log("Reel Lenght " + exports.gameSettings.tempReels[reelIndex].length + " Changed value below Zeros " + Index);
        return exports.gameSettings.tempReels[reelIndex][Index];
    }
    else
        return exports.gameSettings.tempReels[reelIndex][Index];
}
function removeElement(arr, rowIndex, colIndex) {
    console.log("row : " + rowIndex + " col : " + colIndex);
    console.log("temp Reel " + exports.gameSettings.tempReels[rowIndex]);
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
            }
            else {
                // If we are at the last column, remove the last element
                arr[i].pop();
            }
        }
        for (let j = colIndex; j < arr[i].length; j++) {
            if (j + 1 < arr[i].length) {
                arr[i][j] = arr[i][j + 1];
            }
            else {
                // If we are at the last column, remove the last element
                arr[i].pop();
            }
        }
    }
}
function cascadeMoveTowardsNull(arr) {
    // Check if the array is empty or if it has empty subarrays
    if (arr.length === 0 || arr[0].length === 0)
        return arr;
    // Determine the number of rows and columns
    const numRows = arr.length;
    const numCols = arr[0].length;
    // Create a new array to store the result
    let result = Array.from({ length: numRows }, () => new Array(numCols).fill(null));
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
