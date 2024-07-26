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
exports.addPayLineSymbols = addPayLineSymbols;
exports.makePayLines = makePayLines;
exports.spinResult = spinResult;
exports.startFreeSpin = startFreeSpin;
exports.checkforMoolah = checkforMoolah;
exports.weightedRandom = weightedRandom;
exports.generateMatrix = generateMatrix;
exports.shuffleArray = shuffleArray;
exports.convertData = convertData;
exports.convertSymbols = convertSymbols;
exports.removeRecurringIndexSymbols = removeRecurringIndexSymbols;
exports.combineUniqueSymbols = combineUniqueSymbols;
const userSocket_1 = require("../../socket/userSocket");
const middleware_1 = require("../../utils/middleware");
const TestGlobal_1 = require("../TestGlobal");
const _global_1 = require("./_global");
const extraBonusGames_1 = require("./extraBonusGames");
const slotDataInit_1 = require("./slotDataInit");
const slotResults_1 = require("./slotResults");
const slotTypes_1 = require("./slotTypes");
function addPayLineSymbols(symbol, repetition, pay, freeSpins) {
    const line = Array(repetition).fill(symbol); // Create an array with 'repetition' number of 'symbol'
    if (line.length != _global_1.slotGameSettings.matrix.x) {
        let lengthToAdd = _global_1.slotGameSettings.matrix.x - line.length;
        for (let i = 0; i < lengthToAdd; i++)
            line.push("any");
    }
    _global_1.slotGameSettings.payLine.push({
        line: line,
        pay: pay,
        freeSpins: freeSpins,
    });
}
function makePayLines() {
    _global_1.slotGameSettings.currentGamedata.Symbols.forEach((element) => {
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
    _global_1.slotGameSettings.bonusPayTable = [];
    _global_1.slotGameSettings.scatterPayTable = [];
    switch (symbol.Name) {
        case slotTypes_1.specialIcons.jackpot:
            _global_1.slotGameSettings.jackpot.symbolName = symbol.Name;
            _global_1.slotGameSettings.jackpot.symbolId = symbol.Id;
            _global_1.slotGameSettings.jackpot.symbolsCount = symbol.symbolsCount;
            _global_1.slotGameSettings.jackpot.defaultAmount = symbol.defaultAmount;
            _global_1.slotGameSettings.jackpot.increaseValue = symbol.increaseValue;
            break;
        case slotTypes_1.specialIcons.wild:
            _global_1.slotGameSettings.wildSymbol.SymbolName = symbol.Name;
            _global_1.slotGameSettings.wildSymbol.SymbolID = symbol.Id;
            _global_1.slotGameSettings.useWild = true;
            break;
        case slotTypes_1.specialIcons.scatter:
            _global_1.slotGameSettings.scatterPayTable.push({
                symbolCount: symbol.count,
                symbolID: symbol.Id,
                pay: symbol.pay,
                freeSpins: symbol.freeSpin,
            });
            _global_1.slotGameSettings.useScatter = true;
            break;
        case slotTypes_1.specialIcons.bonus:
            _global_1.slotGameSettings.bonusPayTable.push({
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
function spinResult(playerSkt, clientID) {
    // console.log(gameSettings._winData, ":gameSettings._winData");
    if (_global_1.slotGameSettings.currentGamedata.bonus.isEnabled &&
        _global_1.slotGameSettings.currentGamedata.bonus.type == slotTypes_1.bonusGameType.tap)
        _global_1.slotGameSettings.bonus.game = new extraBonusGames_1.bonusGame(_global_1.slotGameSettings.currentGamedata.bonus.noOfItem, clientID);
    TestGlobal_1.GData.playerSocket.deductPlayerBalance(_global_1.slotGameSettings.currentBet);
    // TODO : Middle ware goes here
    (() => __awaiter(this, void 0, void 0, function* () {
        yield (0, middleware_1.middleware)();
    }))();
    _global_1.slotGameSettings.tempReels = [[]];
    _global_1.slotGameSettings.bonus.start = false;
    new slotDataInit_1.RandomResultGenerator();
    // HERE: 
    const result = new slotResults_1.CheckResult(playerSkt);
    result.makeResultJson(playerSkt, slotTypes_1.ResultType.normal);
}
function startFreeSpin(playerSkt) {
    console.log("____----Started FREE SPIN ----_____" + " :::  FREE SPINSS ::::", _global_1.slotGameSettings._winData.freeSpins);
    (0, userSocket_1.sendMessage)(playerSkt, "StartedFreeSpin", {});
    _global_1.slotGameSettings.freeSpinStarted = true;
    for (let i = 0; i <= _global_1.slotGameSettings._winData.freeSpins; i++) {
        _global_1.slotGameSettings.bonus.start = false;
        new slotDataInit_1.RandomResultGenerator();
        new slotResults_1.CheckResult(playerSkt);
        console.log("FREE SPINS LEFTTT ::::" + (_global_1.slotGameSettings._winData.freeSpins - i));
    }
    _global_1.slotGameSettings._winData.freeSpins = 0;
    (0, userSocket_1.sendMessage)(playerSkt, "StoppedFreeSpins", {});
    _global_1.slotGameSettings.freeSpinStarted = false;
    console.log("____----Stopped FREE SPIN ----_____");
}
function checkforMoolah(playerSkt) {
    console.log("_______-------CALLED FOR CHECK FOR MOOLAHHHH-------_______");
    _global_1.slotGameSettings.tempReels = _global_1.slotGameSettings.reels;
    const lastWinData = _global_1.slotGameSettings._winData;
    lastWinData.winningSymbols = combineUniqueSymbols(removeRecurringIndexSymbols(lastWinData.winningSymbols));
    const index = lastWinData.winningSymbols.map((str) => {
        const index = str.split(",").map(Number);
        return index;
    });
    console.log("Winning Indexes " + index);
    let matrix = [];
    matrix = _global_1.slotGameSettings.resultSymbolMatrix;
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
                let index = (_global_1.slotGameSettings.resultReelIndex[i] + j + 2) % _global_1.slotGameSettings.tempReels[i].length;
                transposed[i][j] = _global_1.slotGameSettings.tempReels[i][index];
                row.unshift(_global_1.slotGameSettings.tempReels[i][index]);
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
    _global_1.slotGameSettings.resultSymbolMatrix = matrix;
    const result = new slotResults_1.CheckResult(playerSkt);
    result.makeResultJson(playerSkt, slotTypes_1.ResultType.moolah, iconsToFill);
}
function getLastindex(reelIndex, index) {
    if (index >= _global_1.slotGameSettings.tempReels[reelIndex].length)
        if (index >= _global_1.slotGameSettings.tempReels[reelIndex].length)
            index = index - _global_1.slotGameSettings.tempReels[reelIndex].length;
    console.log("index __", index);
    let Index = index - 1;
    console.log("Changed Index " + Index);
    if (Index < 0) {
        Index = _global_1.slotGameSettings.tempReels[reelIndex].length - 1;
        console.log("Reel Lenght " + _global_1.slotGameSettings.tempReels[reelIndex].length + " Changed value below Zeros " + Index);
        return _global_1.slotGameSettings.tempReels[reelIndex][Index];
    }
    else
        return _global_1.slotGameSettings.tempReels[reelIndex][Index];
}
function cascadeMoveTowardsNull(arr) {
    if (arr.length === 0 || arr[0].length === 0)
        return arr;
    const numRows = arr.length;
    const numCols = arr[0].length;
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
function weightedRandom(items, weights) {
    if (items.length !== weights.length) {
        throw new Error("Items and weights must be of the same size");
    }
    if (!items.length) {
        throw new Error("Items must not be empty");
    }
    // Preparing the cumulative weights array.
    const cumulativeWeights = [];
    for (let i = 0; i < weights.length; i += 1) {
        cumulativeWeights[i] = weights[i] + (cumulativeWeights[i - 1] || 0);
    }
    // Getting the random number in a range of [0...sum(weights)]
    const maxCumulativeWeight = cumulativeWeights[cumulativeWeights.length - 1];
    const randomNumber = maxCumulativeWeight * Math.random();
    // Picking the random item based on its weight.
    for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
        if (cumulativeWeights[itemIndex] >= randomNumber) {
            return {
                item: items[itemIndex],
                index: itemIndex,
            };
        }
    }
    // This should not happen if the weights are correctly defined,
    // but if we get here, return the last item.
    return {
        item: items[items.length - 1],
        index: items.length - 1,
    };
}
// Function to generate a 5x18 matrix of randomly selected items based on weights
function generateMatrix(n_Rows, n_Columns) {
    const matrix = [];
    for (let i = 0; i < n_Rows; i++) {
        const row = [];
        for (let j = 0; j < n_Columns; j++) {
            const result = weightedRandom(_global_1.slotGameSettings.Symbols, _global_1.slotGameSettings.Weights);
            row.push(result.item);
        }
        matrix.push(row);
    }
    // console.log(matrix);
    return matrix;
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let k = array[i];
        array[i] = array[j];
        array[j] = k;
    }
}
function convertData(data) {
    const result = [];
    for (const row of data) {
        const convertedRow = Array.from(Array(row.length + 1).keys()).join(",");
        result.push(`"${convertedRow}"`);
    }
    return result;
}
function convertSymbols(data) {
    let uiData = {
        symbols: [],
    };
    if (!Array.isArray(data)) {
        // console.error("Input data is not an array");
        return uiData;
    }
    data.forEach((element) => {
        let symbolData = {
            ID: element.Id,
            Name: element.Name || {},
            multiplier: element.multiplier || {},
            defaultAmount: element.defaultAmount || {},
            symbolsCount: element.symbolsCount || element.symbolCount || {},
            increaseValue: element.increaseValue || {},
            freeSpin: element.freeSpin
        };
        uiData.symbols.push(symbolData);
    });
    return uiData;
}
function removeRecurringIndexSymbols(symbolsToEmit) {
    const seen = new Set();
    const result = [];
    symbolsToEmit.forEach((subArray) => {
        if (!Array.isArray(subArray)) {
            console.warn('Expected an array but got', subArray);
            return;
        }
        const uniqueSubArray = [];
        subArray.forEach((symbol) => {
            if (!seen.has(symbol)) {
                seen.add(symbol);
                uniqueSubArray.push(symbol);
            }
        });
        if (uniqueSubArray.length > 0) {
            result.push(uniqueSubArray);
        }
    });
    return result;
}
function combineUniqueSymbols(symbolsToEmit) {
    const seen = new Set();
    const result = [];
    symbolsToEmit.forEach((subArray) => {
        subArray.forEach((symbol) => {
            if (!seen.has(symbol)) {
                seen.add(symbol);
                result.push(symbol);
            }
        });
    });
    return result;
}
// Test the function
