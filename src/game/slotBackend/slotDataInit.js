"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomResultGenerator = void 0;
exports.sendInitdata = sendInitdata;
const _global_1 = require("./_global");
const slotResults_1 = require("./slotResults");
const slotUtils_1 = require("./slotUtils");
const slotTypes_1 = require("./slotTypes");
const extraBonusGames_1 = require("./extraBonusGames");
const userSocket_1 = require("../../socket/userSocket");
const Global_1 = require("../Global.");
function sendInitdata(playerSkt, clientID) {
    var _a;
    // const matrix = generateMatrix(gameSettings.matrix.x, 18);
    gameDataInit();
    _global_1.slotGameSettings.reels = generateInitialreel();
    if (_global_1.slotGameSettings.currentGamedata.bonus.isEnabled &&
        _global_1.slotGameSettings.currentGamedata.bonus.type == slotTypes_1.bonusGameType.spin)
        _global_1.slotGameSettings.bonus.game = new extraBonusGames_1.bonusGame(_global_1.slotGameSettings.currentGamedata.bonus.noOfItem, clientID);
    let specialSymbols = _global_1.slotGameSettings.currentGamedata.Symbols.filter((element) => !element.useWildSub);
    // for (let i = 0; i < specialSymbols.length; i++) {
    //   const strng =
    //     "Player has the right to start the slot machine without using their funds for a certain number of times. The size of the bet is determined by the";
    //   UiInitData.spclSymbolTxt.push(strng);
    // }
    const dataToSend = {
        GameData: {
            Reel: _global_1.slotGameSettings.reels,
            // freeSpin: gameSettings.currentGamedata.Symbols[9],
            // Scatter: gameSettings.currentGamedata.Symbols[11],
            // Jackpot: gameSettings.currentGamedata.Symbols[12],
            Lines: _global_1.slotGameSettings.currentGamedata.linesApiData,
            Bets: _global_1.slotGameSettings.currentGamedata.bets,
            canSwitchLines: false,
            LinesCount: _global_1.slotGameSettings.currentGamedata.linesCount,
            autoSpin: [1, 5, 10, 20],
        },
        BonusData: _global_1.slotGameSettings.bonus.game != null
            ? _global_1.slotGameSettings.bonus.game.generateData((_a = _global_1.slotGameSettings.bonusPayTable[0]) === null || _a === void 0 ? void 0 : _a.pay)
            : [],
        UIData: _global_1.UiInitData,
        PlayerData: Global_1.PlayerData,
    };
    (0, userSocket_1.sendMessage)(playerSkt, "InitData", dataToSend);
}
class RandomResultGenerator {
    constructor() {
        let matrix = [];
        let randomIndexArray = [];
        for (let j = 0; j < _global_1.slotGameSettings.matrix.y; j++) {
            let row = [];
            for (let i = 0; i < _global_1.slotGameSettings.matrix.x; i++) {
                if (j == 0) {
                    let rowrandomIndex = Math.floor(Math.random() * (_global_1.slotGameSettings.reels[i].length - 1 - 0)) +
                        0;
                    randomIndexArray.push(rowrandomIndex);
                    row.push(_global_1.slotGameSettings.reels[i][rowrandomIndex].toString());
                }
                else {
                    let initialRandomIndex = randomIndexArray[i];
                    let adjustedIndex = (initialRandomIndex + j) % _global_1.slotGameSettings.reels[i].length;
                    row.push(_global_1.slotGameSettings.reels[i][adjustedIndex].toString());
                }
            }
            matrix.push(row);
        }
        _global_1.slotGameSettings.resultReelIndex = randomIndexArray;
        console.log("indexs", randomIndexArray);
        console.log("gameSettings._winData.resultReelIndex", _global_1.slotGameSettings.resultReelIndex);
        // matrix.pop();
        // matrix.pop();
        // matrix.pop();
        // matrix.push([ '1', '2', '3', '4', '5' ])
        // matrix.push([ '2', '13', '13', '13', '13' ])
        // matrix.push([ '1', '1', '1', '1', '6' ])
        _global_1.slotGameSettings.resultSymbolMatrix = matrix;
        console.log("MATRIX " + matrix);
    }
    // Function to generate a random number based on weights
    randomWeightedIndex(weights) {
        const totalWeight = weights.reduce((acc, val) => acc + val, 0);
        const randomNumber = Math.random() * totalWeight;
        let weightSum = 0;
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
exports.RandomResultGenerator = RandomResultGenerator;
function gameDataInit() {
    _global_1.slotGameSettings.lineData = _global_1.slotGameSettings.currentGamedata.linesApiData;
    // gameSettings.bonus.start = false;
    makeFullPayTable();
}
function generateInitialreel() {
    let matrix = [];
    for (let i = 0; i < _global_1.slotGameSettings.matrix.x; i++) {
        let reel = [];
        _global_1.slotGameSettings.currentGamedata.Symbols.forEach((element) => {
            for (let j = 0; j < element.reelInstance[i]; j++) {
                reel.push(element.Id.toString());
            }
        });
        (0, slotUtils_1.shuffleArray)(reel);
        matrix.push(reel);
    }
    return matrix;
}
function makeFullPayTable() {
    let payTable = [];
    let payTableFull = [];
    _global_1.slotGameSettings.payLine.forEach((pLine) => {
        payTable.push(new slotResults_1.PayLines(pLine.line, pLine.pay, pLine.freeSpins, _global_1.slotGameSettings.wildSymbol.SymbolName));
    });
    for (let j = 0; j < payTable.length; j++) {
        payTableFull.push(payTable[j]);
        if (_global_1.slotGameSettings.useWild) {
            let wildLines = payTable[j].getWildLines();
            wildLines.forEach((wl) => {
                payTableFull.push(wl);
            });
        }
    }
    _global_1.slotGameSettings.fullPayTable = payTableFull;
}
