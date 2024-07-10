"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomResultGenerator = void 0;
exports.sendInitdata = sendInitdata;
const bonusResults_1 = require("./bonusResults");
const global_1 = require("./global");
const gameUtils_1 = require("./gameUtils");
const slotResults_1 = require("./slotResults");
const userSocket_1 = require("../socket/userSocket");
const gameUtils_2 = require("./gameUtils");
function sendInitdata(clientID) {
    var _a;
    // const matrix = generateMatrix(gameSettings.matrix.x, 18);
    gameDataInit();
    global_1.gameSettings.reels = generateInitialreel();
    global_1.playerData.playerId = clientID;
    if (global_1.gameSettings.currentGamedata.bonus.isEnabled &&
        global_1.gameSettings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.spin)
        global_1.gameSettings.bonus.game = new bonusResults_1.bonusGame(global_1.gameSettings.currentGamedata.bonus.noOfItem, clientID);
    let specialSymbols = global_1.gameSettings.currentGamedata.Symbols.filter((element) => !element.useWildSub);
    for (let i = 0; i < specialSymbols.length; i++) {
        const strng = "Player has the right to start the slot machine without using their funds for a certain number of times. The size of the bet is determined by the";
        global_1.UiInitData.spclSymbolTxt.push(strng);
    }
    const dataToSend = {
        GameData: {
            Reel: global_1.gameSettings.reels,
            Lines: global_1.gameSettings.currentGamedata.linesApiData,
            Bets: global_1.gameSettings.currentGamedata.bets,
            canSwitchLines: false,
            LinesCount: global_1.gameSettings.currentGamedata.linesCount,
            autoSpin: [1, 5, 10, 20],
        },
        BonusData: global_1.gameSettings.bonus.game != null
            ? global_1.gameSettings.bonus.game.generateData((_a = global_1.gameSettings.bonusPayTable[0]) === null || _a === void 0 ? void 0 : _a.pay)
            : [],
        UIData: global_1.UiInitData,
        PlayerData: global_1.playerData,
    };
    (0, userSocket_1.getClient)(clientID).sendMessage("InitData", dataToSend);
    // sendMessageToClient(clientID, "InitData", dataToSend);
}
class RandomResultGenerator {
    constructor() {
        let matrix = [];
        let randomIndexArray = [];
        for (let j = 0; j < global_1.gameSettings.matrix.y; j++) {
            let row = [];
            for (let i = 0; i < global_1.gameSettings.matrix.x; i++) {
                if (j == 0) {
                    let rowrandomIndex = Math.floor(Math.random() * (global_1.gameSettings.reels[i].length - 1 - 0)) +
                        0;
                    randomIndexArray.push(rowrandomIndex);
                    row.push(global_1.gameSettings.reels[i][rowrandomIndex].toString());
                }
                else {
                    // if (randomIndexArray[i] == 0)
                    //   row.push(gameSettings.reels[i][randomIndexArray[i] + j].toString());
                    // else if (randomIndexArray[i] == gameSettings.reels[i].length - 1)
                    //   row.push(gameSettings.reels[i][randomIndexArray[i] - j].toString());
                    // else if (randomIndexArray[i] <= gameSettings.matrix.y)
                    //   row.push(gameSettings.reels[i][randomIndexArray[i] + j].toString());
                    // else if (randomIndexArray[i] > gameSettings.matrix.y)
                    //   row.push(gameSettings.reels[i][randomIndexArray[i] - j].toString());
                    let initialRandomIndex = randomIndexArray[i];
                    let adjustedIndex = (initialRandomIndex + j) % global_1.gameSettings.reels[i].length;
                    row.push(global_1.gameSettings.reels[i][adjustedIndex].toString());
                }
            }
            matrix.push(row);
        }
        global_1.gameSettings.resultReelIndex = randomIndexArray;
        console.log("indexs", randomIndexArray);
        console.log("gameSettings._winData.resultReelIndex", global_1.gameSettings.resultReelIndex);
        //  matrix.pop();
        // matrix.pop();
        // matrix.pop();
        // matrix.push([ '1', '2', '3', '4', '5' ])
        // matrix.push([ '2', '13', '13', '13', '13' ])
        // matrix.push([ '1', '1', '1', '1', '6' ])
        global_1.gameSettings.resultSymbolMatrix = matrix;
        console.log("MATRIX " + matrix);
    }
    // export class RandomResultGenerator {
    //   constructor() {
    //     // Generating a 3x5 matrix of random numbers based on weights
    //     const matrix: string[][] = [];
    //     for (let i = 0; i < gameSettings.matrix.y; i++) {
    //       const row: string[] = [];
    //       for (let j = 0; j < gameSettings.matrix.x; j++) {
    //         const randomIndex: number = this.randomWeightedIndex(
    //           gameSettings.Weights
    //         );
    //         row.push(gameSettings.Symbols[randomIndex]);
    //       }
    //       matrix.push(row);
    //     }
    // matrix.pop();
    // matrix.pop();
    // matrix.pop();
    // matrix.push([ '4', '0', '0', '0', '4' ])
    // matrix.push([ '6', '4', '8', '4', '2' ])
    // matrix.push([ '1', '8', '4', '4', '8' ])
    //     gameSettings.resultSymbolMatrix = matrix;
    //     gameDataInit();
    //   }
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
    global_1.gameSettings.lineData = global_1.gameSettings.currentGamedata.linesApiData;
    // gameSettings.bonus.start = false;
    makeFullPayTable();
}
function generateInitialreel() {
    let matrix = [];
    for (let i = 0; i < global_1.gameSettings.matrix.x; i++) {
        let reel = [];
        global_1.gameSettings.currentGamedata.Symbols.forEach((element) => {
            for (let j = 0; j < element.reelInstance[i]; j++) {
                reel.push(element.Id.toString());
            }
        });
        (0, gameUtils_2.shuffleArray)(reel);
        matrix.push(reel);
    }
    return matrix;
}
function makeFullPayTable() {
    let payTable = [];
    let payTableFull = [];
    global_1.gameSettings.payLine.forEach((pLine) => {
        payTable.push(new slotResults_1.PayLines(pLine.line, pLine.pay, pLine.freeSpins, global_1.gameSettings.wildSymbol.SymbolName));
    });
    // console.log("payTable : ", payTable);
    for (let j = 0; j < payTable.length; j++) {
        payTableFull.push(payTable[j]);
        // console.log("payTable[j] :", payTable[j]);
        if (global_1.gameSettings.useWild) {
            let wildLines = payTable[j].getWildLines();
            wildLines.forEach((wl) => {
                payTableFull.push(wl);
            });
        }
    }
    global_1.gameSettings.fullPayTable = payTableFull;
    // let payTable: any[] = [];
    // let payTableFull = [];
    // if (gameSettings.useWild) {
    //     gameSettings.payLine.forEach((pLine) => {
    //         payTable.push(new PayLines(pLine.line, pLine.pay, pLine.freeSpins, gameSettings.wildSymbol.SymbolID.toString()))
    //     })
    // } else {
    //     gameSettings.currentGamedata.Symbols.forEach((element)=>{
    //         if(element.useWildSub || element.multiplier?.length>0){
    //             gameSettings.payLine.forEach((pLine) => {
    //                 payTable.push(new PayLines(pLine.line, pLine.pay, pLine.freeSpins, element.Id.toString()))
    //             })
    //         }
    //     })
    //     // payTable = gameSettings.payLine;
    // }
    // for (let j = 0; j < payTable.length; j++) {
    //     payTableFull.push(payTable[j]);
    //     let wildLines;
    //     if (gameSettings.useWild){
    //         wildLines = payTable[j].getWildLines();
    //         gameSettings.payLine.forEach((pLine) => {
    //             payTable.push(new PayLines(pLine.line, pLine.pay, pLine.freeSpins, gameSettings.wildSymbol.SymbolID.toString()))
    //         })
    //     }
    // }
    // console.log("full paytable", payTableFull);
    // gameSettings.fullPayTable = payTableFull;
}
