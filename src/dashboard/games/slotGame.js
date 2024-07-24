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
const userModel_1 = require("../users/userModel");
const PayLines_1 = __importDefault(require("./PayLines"));
const RandomResultGenerator_1 = require("./RandomResultGenerator");
const CheckResult_1 = require("./CheckResult");
const GambleGame_1 = require("./GambleGame");
class SlotGame {
    constructor(player, GameData) {
        this.player = Object.assign(Object.assign({}, player), { haveWon: 0, currentWining: 0 });
        this.settings = {
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
            },
            currentBet: 0,
            currentLines: 0,
            BetPerLines: 0,
            startGame: false,
            gamble: new GambleGame_1.gambleCardGame(this),
            reels: [[]],
        };
        this.initialize(GameData);
        this.messageHandler();
    }
    initialize(GameData) {
        this.settings.bonusPayTable = [];
        this.settings.scatterPayTable = [];
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
                switch (res.id) {
                    case "SPIN":
                        if (this.settings.currentBet > this.player.credits) {
                            console.log("Low Balance : ", this.player.credits);
                            console.log("Current Bet : ", this.settings.currentBet);
                            this.sendError("Low Balance");
                            break;
                        }
                        if (this.settings.startGame) {
                            this.settings.currentLines = res.data.currentLines;
                            this.settings.BetPerLines = gameUtils_1.betMultiplier[res.data.currentBet];
                            this.settings.currentBet = gameUtils_1.betMultiplier[res.data.currentBet] * this.settings.currentLines;
                            this.spinResult();
                        }
                        break;
                    case "GENRTP":
                        if (this.settings.currentBet > this.player.credits) {
                            console.log("Low Balance : ", this.player.credits);
                            console.log("Current Bet : ", this.settings.currentBet);
                            this.sendError("Low Balance");
                            break;
                        }
                        this.settings.currentLines = res.data.currentLines;
                        this.settings.BetPerLines = gameUtils_1.betMultiplier[res.data.currentBet];
                        this.settings.currentBet = gameUtils_1.betMultiplier[res.data.currentBet] * this.settings.currentLines;
                        this.getRTP(res.data.spins);
                        break;
                    case "checkMoolah":
                        this.checkforMoolah();
                        break;
                    case "GambleInit":
                        this.settings.gamble.resetGamble();
                        const sendData = this.settings.gamble.sendInitGambleData(res.data.GAMBLETYPE);
                        this.sendMessage("gambleInitData", sendData);
                        break;
                    case "GambleResultData":
                        this.settings.gamble.getResult(res.data);
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
            try {
                const finalBalance = this.player.credits;
                const result = yield userModel_1.Player.findOneAndUpdate({ username: this.player.username }, { credits: finalBalance.toFixed(2) }, { new: true });
                if (!result) {
                    console.log(`Player with username ${this.player.username} not found in database.`);
                }
                else {
                    console.log(`Updated credits for player ${this.player.username} to ${this.player.credits}.`);
                }
            }
            catch (error) {
                console.error("Failed to update database:", error);
                this.sendError("Database error");
            }
        });
    }
    checkPlayerBalance() {
        if (this.player.credits < this.settings.currentBet) {
            this.sendMessage("low-balance", true);
            console.log("PLAYER BALANCE : ", this.player.credits);
            console.log("CURRENT BET : ", this.settings.currentBet);
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
                console.log("FINAL BALANCE : ", this.player.credits);
                yield this.updateDatabase();
            }
            catch (error) {
                console.error('Error updating credits in database:', error);
            }
        });
    }
    deductPlayerBalance(credit) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkPlayerBalance();
            this.player.credits -= credit;
            yield this.updateDatabase();
        });
    }
    initSymbols() {
        var _a, _b;
        for (let i = 0; i < this.settings.currentGamedata.Symbols.length; i++) {
            this.settings.Symbols.push((_a = this.settings.currentGamedata.Symbols[i].Id) === null || _a === void 0 ? void 0 : _a.toString());
            this.settings.Weights.push((_b = this.settings.currentGamedata.Symbols[i]) === null || _b === void 0 ? void 0 : _b.weightedRandomness);
        }
    }
    makePayLines() {
        this.settings.currentGamedata.Symbols.forEach((element) => {
            var _a;
            if (element.useWildSub || element.Name == "FreeSpin" || element.Name == "Scatter") {
                (_a = element.multiplier) === null || _a === void 0 ? void 0 : _a.forEach(((item, index) => {
                    var _a;
                    this.addPayLineSymbols((_a = element.Id) === null || _a === void 0 ? void 0 : _a.toString(), 5 - index, item[0], item[1]);
                }));
            }
            else {
                this.handleSpecialSymbols(element);
            }
        });
    }
    addPayLineSymbols(symbol, repetition, pay, freeSpins) {
        const line = Array(repetition).fill(symbol); // Create an array with 'repetition' number of 'symbol'
        if (line.length != this.settings.matrix.x) {
            let lengthToAdd = this.settings.matrix.x - line.length;
            for (let i = 0; i < lengthToAdd; i++)
                line.push("any");
        }
        this.settings.payLine.push({ line: line, pay: pay, freeSpins: freeSpins });
    }
    handleSpecialSymbols(symbol) {
        this.settings.bonusPayTable = [];
        this.settings.scatterPayTable = [];
        switch (symbol.Name) {
            case gameUtils_1.specialIcons.jackpot:
                this.settings.jackpot.symbolName = symbol.Name;
                this.settings.jackpot.symbolId = symbol.Id;
                this.settings.jackpot.symbolsCount = symbol.symbolsCount;
                this.settings.jackpot.defaultAmount = symbol.defaultAmount;
                this.settings.jackpot.increaseValue = symbol.increaseValue;
                break;
            case gameUtils_1.specialIcons.wild:
                this.settings.wildSymbol.SymbolName = symbol.Name;
                this.settings.wildSymbol.SymbolID = symbol.Id;
                this.settings.useWild = true;
                break;
            case gameUtils_1.specialIcons.scatter:
                this.settings.scatterPayTable.push({
                    symbolCount: symbol.count,
                    symbolID: symbol.Id,
                    pay: symbol.pay,
                    freeSpins: symbol.freeSpin,
                });
                this.settings.useScatter = true;
                break;
            case gameUtils_1.specialIcons.bonus:
                this.settings.bonusPayTable.push({
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
    sendInitdata() {
        var _a;
        this.gameDataInit();
        this.settings.reels = this.generateInitialreel();
        if (this.settings.currentGamedata.bonus.isEnabled && this.settings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.spin) {
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
            BonusData: this.settings.bonus.game != null ? this.settings.bonus.game.generateData((_a = this.settings.bonusPayTable[0]) === null || _a === void 0 ? void 0 : _a.pay) : [],
            UIData: gameUtils_1.UiInitData,
            PlayerData: {
                Balance: this.player.credits,
                haveWon: this.player.haveWon,
                currentWining: this.player.currentWining
            }
        };
        // console.log("Data to send : ", dataToSend);
        this.sendMessage("InitData", dataToSend);
    }
    generateInitialreel() {
        let matrix = [];
        for (let i = 0; i < this.settings.matrix.x; i++) {
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
    gameDataInit() {
        this.settings.lineData = this.settings.currentGamedata.linesApiData;
        this.makeFullPayTable();
    }
    makeFullPayTable() {
        try {
            let payTable = [];
            let payTableFull = [];
            this.settings.payLine.forEach((pLine) => {
                payTable.push(new PayLines_1.default(pLine.line, pLine.pay, pLine.freeSpins, this.settings.wildSymbol.SymbolName, this));
            });
            for (let j = 0; j < payTable.length; j++) {
                payTableFull.push(payTable[j]);
                if (this.settings.useWild) {
                    let wildLines = payTable[j].getWildLines();
                    wildLines.forEach((wl) => {
                        payTableFull.push(wl);
                    });
                }
            }
            this.settings.fullPayTable = payTableFull;
        }
        catch (error) {
            console.log("MAKE FULL PAY TABLE : ", error);
        }
    }
    spinResult() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.settings.currentGamedata.bonus.isEnabled && this.settings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.tap) {
                    this.settings.bonus.game = new BonusGame_1.BonusGame(this.settings.currentGamedata.bonus.noOfItem, this);
                }
                yield this.deductPlayerBalance(this.settings.currentBet);
                /*
                MIDDLEWARE GOES HERE
                */
                this.settings.tempReels = [[]];
                this.settings.bonus.start = false;
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
            for (let i = 0; i < spins; i++) {
                this.spinResult();
                spend += this.settings.currentBet;
                won = this.settings._winData.totalWinningAmount;
            }
            let rtp = 0;
            console.log(`Bet:${this.settings.currentBet}\n,player total bet ${spend} and\n won ${won}`);
            if (spend > 0) {
                rtp = (won / spend);
            }
            console.log('BONUS :', this.settings.noOfBonus);
            console.log('TOTAL BONUS : ', this.settings.totalBonuWinAmount);
            console.log('GENERATED RTP : ', rtp);
            return;
        }
        catch (error) {
            console.error("Failed to calculate RTP:", error);
            this.sendError("RTP calculation error");
        }
    }
    checkforMoolah() {
        try {
            console.log("--------------------- CALLED FOR CHECK FOR MOOLAHHHH ---------------------");
            this.settings.tempReels = this.settings.reels;
            const lastWinData = this.settings._winData;
            lastWinData.winningSymbols = this.combineUniqueSymbols(this.removeRecurringIndexSymbols(lastWinData.winningSymbols));
            const index = lastWinData.winningSymbols.map((str) => {
                const index = str.split(",").map(Number);
                return index;
            });
            console.log("Winning Indexes " + index);
            let matrix = [];
            matrix = this.settings.resultSymbolMatrix;
            index.forEach(element => {
                matrix[element[1]][element[0]] = null;
            });
            const movedArray = this.cascadeMoveTowardsNull(matrix);
            let transposed = this.transposeMatrix(movedArray);
            let iconsToFill = [];
            for (let i = 0; i < transposed.length; i++) {
                let row = [];
                for (let j = 0; j < transposed[i].length; j++) {
                    if (transposed[i][j] == null) {
                        let index = (this.settings.resultReelIndex[i] + j + 2) % this.settings.tempReels[i].length;
                        transposed[i][j] = this.settings.tempReels[i][index];
                        row.unshift(this.settings.tempReels[i][index]);
                    }
                }
                if (row.length > 0)
                    iconsToFill.push(row);
            }
            matrix = this.transposeMatrix(transposed);
            // matrix.pop();
            // matrix.pop();
            // matrix.pop();
            // matrix.push([ '1', '2', '3', '4', '5' ])
            // matrix.push([ '1', '1', '1', '1', '6' ])
            // matrix.push([ '0', '0', '0', '0', '0' ])
            console.log("iconsTofill", iconsToFill);
            this.settings.resultSymbolMatrix = matrix;
            const result = new CheckResult_1.CheckResult(this);
            result.makeResultJson(gameUtils_1.ResultType.moolah, iconsToFill);
        }
        catch (error) {
            console.error("Failed to check for Moolah:", error);
            this.sendError("Moolah check error");
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
