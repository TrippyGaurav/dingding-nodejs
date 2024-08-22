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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gameUtils_1 = require("./gameUtils");
const BonusGame_1 = require("./BonusGame");
const WinData_1 = require("./WinData");
const userModel_1 = require("../../dashboard/users/userModel");
const RandomResultGenerator_1 = require("./RandomResultGenerator");
const CheckResult_1 = require("./CheckResult");
const newGambleGame_1 = require("./newGambleGame");
const mongoose_1 = __importDefault(require("mongoose"));
class SlotGame {
    constructor(player, GameData) {
        this.player = Object.assign(Object.assign({}, player), { haveWon: 0, currentWining: 0, totalbet: 0, rtpSpinCount: 0, totalSpin: 0 });
        this.settings = {
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
        this.initialize(GameData);
        this.messageHandler();
    }
    initialize(GameData) {
        this.settings.Symbols = [];
        this.settings.Weights = [];
        this.settings._winData = new WinData_1.WinData(this);
        this.settings.currentGamedata = GameData[0] || GameData;
        this.initSymbols();
        gameUtils_1.UiInitData.paylines = (0, gameUtils_1.convertSymbols)(this.settings.currentGamedata.Symbols);
        this.settings.startGame = true;
        this.makePayLines();
        this.sendInitdata();
    }
    sendMessage(action, message) {
        this.player.socket.emit("message" /* messageType.MESSAGE */, JSON.stringify({ id: action, message, username: this.player.username }));
    }
    sendError(message) {
        this.player.socket.emit("internalError" /* messageType.ERROR */, message);
    }
    sendAlert(message) {
        this.player.socket.emit("alert" /* messageType.ALERT */, message);
    }
    messageHandler() {
        this.player.socket.on("message", (message) => {
            try {
                const res = JSON.parse(message);
                console.log("Message Recieved : ", message);
                switch (res.id) {
                    case "SPIN":
                        if (this.settings.startGame) {
                            this.settings.currentLines = res.data.currentLines;
                            this.settings.BetPerLines = gameUtils_1.betMultiplier[res.data.currentBet];
                            this.settings.currentBet = gameUtils_1.betMultiplier[res.data.currentBet] * this.settings.currentLines;
                            this.spinResult();
                        }
                        break;
                    case "GENRTP":
                        this.settings.currentLines = res.data.currentLines;
                        this.settings.BetPerLines = gameUtils_1.betMultiplier[res.data.currentBet];
                        this.settings.currentBet =
                            gameUtils_1.betMultiplier[res.data.currentBet] * this.settings.currentLines;
                        this.getRTP(res.data.spins);
                        break;
                    case "checkMoolah":
                        this.checkforMoolah();
                        break;
                    case "GambleInit":
                        this.settings.gamble.resetGamble();
                        const sendData = this.settings.gamble.sendInitGambleData(res.data.GAMBLETYPE);
                        console.log(sendData);
                        this.sendMessage("gambleInitData", sendData);
                        break;
                    case "GambleResultData":
                        this.settings.gamble.getResult(res.data.GAMBLETYPE);
                        break;
                    case "GAMBLECOLLECT":
                        this.settings.gamble.updateCredits();
                        break;
                    default:
                        console.warn(`Unhandled message ID: ${res.id}`);
                        this.sendError(`Unhandled message ID: ${res.id}`);
                        break;
                }
            }
            catch (error) {
                console.error("Failed to parse message:", error);
                this.sendError("Failed to parse message");
            }
        });
    }
    updateDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            try {
                session.startTransaction();
                const finalBalance = this.player.credits;
                yield userModel_1.Player.findOneAndUpdate({ username: this.player.username }, { credits: finalBalance.toFixed(2) }, { new: true, session });
                yield session.commitTransaction();
            }
            catch (error) {
                yield session.abortTransaction();
                console.error("Failed to update database:", error);
                if (error.message.includes("Write conflict")) {
                    // Retry logic could be added here
                }
                this.sendError("Database error");
            }
            finally {
                session.endSession();
            }
        });
    }
    checkPlayerBalance() {
        if (this.player.credits < this.settings.currentBet) {
            this.sendMessage("low-balance", true);
            console.error("LOW BALANCE");
            return;
        }
    }
    updatePlayerBalance(credit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.player.credits += credit;
                this.player.haveWon += credit;
                this.player.currentWining = credit;
                yield this.updateDatabase();
            }
            catch (error) {
                console.error("Error updating credits in database:", error);
            }
        });
    }
    deductPlayerBalance(credit) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkPlayerBalance();
            this.player.credits -= credit;
            // await this.updateDatabase();
        });
    }
    initSymbols() {
        var _a, _b;
        for (let i = 0; i < this.settings.currentGamedata.Symbols.length; i++) {
            this.settings.Symbols.push((_a = this.settings.currentGamedata.Symbols[i].Id) === null || _a === void 0 ? void 0 : _a.toString(), this.settings.currentGamedata.Symbols[i].multiplier);
            this.settings.Weights.push((_b = this.settings.currentGamedata.Symbols[i]) === null || _b === void 0 ? void 0 : _b.weightedRandomness);
        }
    }
    makePayLines() {
        this.settings.currentGamedata.Symbols.forEach((element) => {
            var _a;
            if (element.useWildSub) {
                (_a = element.multiplier) === null || _a === void 0 ? void 0 : _a.forEach((item, index) => {
                    var _a;
                    this.addPayLineSymbols((_a = element.Id) === null || _a === void 0 ? void 0 : _a.toString(), 5 - index, item[0], item[1]);
                });
            }
            else {
                this.handleSpecialSymbols(element);
            }
        });
    }
    addPayLineSymbols(symbol, repetition, pay, freeSpins) {
        const line = Array(repetition).fill(symbol); // Create an array with 'repetition' number of 'symbol'
        if (line.length != this.settings.currentGamedata.matrix.x) {
            let lengthToAdd = this.settings.currentGamedata.matrix.x - line.length;
            for (let i = 0; i < lengthToAdd; i++)
                line.push("any");
        }
        this.settings.payLine.push({ line: line, pay: pay, freeSpins: freeSpins });
    }
    handleSpecialSymbols(symbol) {
        switch (symbol.Name) {
            case gameUtils_1.specialIcons.FreeSpin:
                this.settings.freeSpin.symbolID = symbol.Id;
                this.settings.freeSpin.freeSpinMuiltiplier = symbol.multiplier;
                this.settings.freeSpin.useFreeSpin = true;
                break;
            case gameUtils_1.specialIcons.jackpot:
                this.settings.jackpot.symbolName = symbol.Name;
                this.settings.jackpot.symbolId = symbol.Id;
                this.settings.jackpot.symbolsCount = symbol.symbolsCount;
                this.settings.jackpot.defaultAmount = symbol.defaultAmount;
                this.settings.jackpot.increaseValue = symbol.increaseValue;
                this.settings.jackpot.useJackpot = true;
                break;
            case gameUtils_1.specialIcons.wild:
                this.settings.wildSymbol.SymbolName = symbol.Name;
                this.settings.wildSymbol.SymbolID = symbol.Id;
                this.settings.wildSymbol.useWild = true;
                break;
            case gameUtils_1.specialIcons.scatter:
                this.settings.scatter.symbolID = symbol.Id,
                    this.settings.scatter.multiplier = symbol.multiplier;
                this.settings.scatter.useScatter = true;
                break;
            case gameUtils_1.specialIcons.bonus:
                this.settings.bonus.id = symbol.Id;
                this.settings.bonus.symbolCount = symbol.symbolCount;
                this.settings.bonus.pay = symbol.pay;
                this.settings.bonus.useBonus = true;
                break;
            default:
                break;
        }
    }
    sendInitdata() {
        this.settings.lineData = this.settings.currentGamedata.linesApiData;
        this.settings.reels = this.generateInitialreel();
        if (this.settings.currentGamedata.bonus.isEnabled &&
            this.settings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.spin) {
            this.settings.bonus.game = new BonusGame_1.BonusGame(this.settings.currentGamedata.bonus.noOfItem, this);
        }
        let specialSymbols = this.settings.currentGamedata.Symbols.filter((element) => !element.useWildSub);
        const dataToSend = {
            GameData: {
                Reel: this.settings.reels,
                Lines: this.settings.currentGamedata.linesApiData,
                Bets: this.settings.currentGamedata.bets,
                canSwitchLines: false,
                LinesCount: this.settings.currentGamedata.linesCount,
                autoSpin: [1, 5, 10, 20],
            },
            // TODO: Unknown source of generateData()
            BonusData: this.settings.bonus.game != null
                ? this.settings.bonus.game.generateData(this.settings.bonus.pay)
                : [],
            UIData: gameUtils_1.UiInitData,
            PlayerData: {
                Balance: this.player.credits,
                haveWon: this.player.haveWon,
                currentWining: this.player.currentWining,
                totalbet: this.player.totalbet
            },
            maxGambleBet: 300,
        };
        this.sendMessage("InitData", dataToSend);
    }
    generateInitialreel() {
        let matrix = [];
        for (let i = 0; i < this.settings.currentGamedata.matrix.x; i++) {
            let reel = [];
            this.settings.currentGamedata.Symbols.forEach((element) => {
                for (let j = 0; j < element.reelInstance[i]; j++) {
                    reel.push(element.Id.toString());
                }
            });
            (0, gameUtils_1.shuffleArray)(reel);
            matrix.push(reel);
        }
        return matrix;
    }
    spinResult() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.settings.currentBet > this.player.credits) {
                    console.log("Low Balance : ", this.player.credits);
                    console.log("Current Bet : ", this.settings.currentBet);
                    this.sendError("Low Balance");
                    return;
                }
                if (this.settings.currentGamedata.bonus.isEnabled && this.settings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.tap) {
                    this.settings.bonus.game = new BonusGame_1.BonusGame(this.settings.currentGamedata.bonus.noOfItem, this);
                }
                /*
                MIDDLEWARE GOES HERE
                */
                if (!this.settings.freeSpin.freeSpinStarted && this.settings.freeSpin.freeSpinCount === 0) {
                    yield this.deductPlayerBalance(this.settings.currentBet);
                }
                if (this.settings.freeSpin.freeSpinStarted && this.settings.freeSpin.freeSpinCount > 0) {
                    this.settings.freeSpin.freeSpinCount--;
                    this.settings.freeSpin.freeSpinsAdded = false;
                    this.settings.currentBet = 0;
                    console.log(this.settings.freeSpin.freeSpinCount, 'this.settings.freeSpinCount');
                    if (this.settings.freeSpin.freeSpinCount <= 0) {
                        this.settings.freeSpin.freeSpinStarted = false;
                        this.settings.freeSpin.freeSpinsAdded = false;
                    }
                }
                this.settings.tempReels = [[]];
                this.settings.bonus.start = false;
                this.player.totalbet += this.settings.currentBet;
                new RandomResultGenerator_1.RandomResultGenerator(this);
                const result = new CheckResult_1.CheckResult(this);
                result.makeResultJson(gameUtils_1.ResultType.normal);
            }
            catch (error) {
                console.error("Failed to generate spin results:", error);
                this.sendError("Spin error");
            }
        });
    }
    getRTP(spins) {
        try {
            let spend = 0;
            let won = 0;
            this.player.rtpSpinCount = spins;
            for (let i = 0; i < this.player.rtpSpinCount; i++) {
                this.spinResult();
                spend += this.settings.currentBet;
                won = this.settings._winData.totalWinningAmount;
            }
            let rtp = 0;
            if (spend > 0) {
                rtp = won / spend;
            }
            return;
        }
        catch (error) {
            console.error("Failed to calculate RTP:", error);
            this.sendError("RTP calculation error");
        }
    }
    checkforMoolah() {
        try {
            this.settings.tempReels = this.settings.reels;
            const lastWinData = this.settings._winData;
            lastWinData.winningSymbols = this.combineUniqueSymbols(this.removeRecurringIndexSymbols(lastWinData.winningSymbols));
            const index = lastWinData.winningSymbols.map((str) => {
                const index = str.split(",").map(Number);
                return index;
            });
            let matrix = [];
            matrix = this.settings.resultSymbolMatrix;
            index.forEach((element) => {
                matrix[element[1]][element[0]] = null;
            });
            const movedArray = this.cascadeMoveTowardsNull(matrix);
            let transposed = this.transposeMatrix(movedArray);
            let iconsToFill = [];
            for (let i = 0; i < transposed.length; i++) {
                let row = [];
                for (let j = 0; j < transposed[i].length; j++) {
                    if (transposed[i][j] == null) {
                        let index = (this.settings.resultReelIndex[i] + j + 2) %
                            this.settings.tempReels[i].length;
                        transposed[i][j] = this.settings.tempReels[i][index];
                        row.unshift(this.settings.tempReels[i][index]);
                        this.settings.tempReels[i].splice(j, 1);
                    }
                }
                if (row.length > 0)
                    iconsToFill.push(row);
            }
            matrix = this.transposeMatrix(transposed);
            this.settings.resultSymbolMatrix = matrix;
            // tempGame.
            const result = new CheckResult_1.CheckResult(this);
            result.makeResultJson(gameUtils_1.ResultType.moolah, iconsToFill);
            this.settings._winData.winningSymbols = [];
            this.settings.tempReels = [];
        }
        catch (error) {
            console.error("Failed to check for Moolah:", error);
            this.sendError("Moolah check error");
            return error;
        }
    }
    combineUniqueSymbols(symbolsToEmit) {
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
    removeRecurringIndexSymbols(symbolsToEmit) {
        const seen = new Set();
        const result = [];
        symbolsToEmit.forEach((subArray) => {
            if (!Array.isArray(subArray)) {
                console.warn("Expected an array but got", subArray);
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
    cascadeMoveTowardsNull(arr) {
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
    transposeMatrix(matrix) {
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
}
exports.default = SlotGame;
