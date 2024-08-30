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
exports.SLCM = void 0;
const gameUtils_1 = require("../../Utils/gameUtils");
const WinData_1 = require("../BaseSlotGame/WinData");
const RandomResultGenerator_1 = require("../RandomResultGenerator");
class SLCM {
    constructor(currentGameData) {
        this.currentGameData = currentGameData;
        this.playerData = {
            haveWon: 0,
            currentWining: 0,
            totalbet: 0,
            rtpSpinCount: 0,
            totalSpin: 0,
        };
        this.settings = {
            id: currentGameData.gameSettings.id,
            isSpecial: currentGameData.gameSettings.isSpecial,
            matrix: currentGameData.gameSettings.matrix,
            bets: currentGameData.gameSettings.bets,
            Symbols: this.initSymbols,
            resultSymbolMatrix: [],
            currentGamedata: currentGameData.gameSettings,
            _winData: new WinData_1.WinData(this),
            currentBet: 0, // Set initial value
            currentLines: 0, // Set initial value
            BetPerLines: 0, // Set initial value
            reels: [], // Initialize reels array
            lastRedSpin: { Index: -1, Symbol: -1 },
            lastReSpin: { Index: -1, Symbol: -1 },
        };
        console.log(this.settings.Symbols[0]);
        this.initialize(currentGameData.gameSettings);
    }
    sendMessage(action, message) {
        this.currentGameData.sendMessage(action, message);
    }
    sendError(message) {
        this.currentGameData.sendError(message);
    }
    sendAlert(message) {
        this.currentGameData.sendAlert(message);
    }
    updatePlayerBalance(message) {
        this.currentGameData.updatePlayerBalance(message);
    }
    deductPlayerBalance(message) {
        this.currentGameData.deductPlayerBalance(message);
    }
    getPlayerData() {
        return this.currentGameData.getPlayerData();
    }
    messageHandler(response) {
        switch (response.id) {
            case "SPIN":
                this.settings.matrix.x = 3;
                this.settings.currentLines = response.data.currentLines;
                this.settings.BetPerLines = gameUtils_1.betMultiplier[response.data.currentBet];
                this.settings.currentBet =
                    gameUtils_1.betMultiplier[response.data.currentBet] *
                        this.settings.currentLines;
                this.spinResult();
                break;
        }
    }
    spinResult() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const playerData = this.getPlayerData();
                if (this.settings.currentBet > playerData.credits) {
                    console.log("Low Balance : ", playerData.credits);
                    console.log("Current Bet : ", this.settings.currentBet);
                    this.sendError("Low Balance");
                    return;
                }
                yield this.deductPlayerBalance(this.settings.currentBet);
                this.playerData.totalbet += this.settings.currentBet;
                new RandomResultGenerator_1.RandomResultGenerator(this);
                this.checkResult();
            }
            catch (error) {
                console.error("Failed to generate spin results:", error);
                this.sendError("Spin error");
            }
        });
    }
    checkResult() {
        const payoutSheet = [];
        console.log(this.settings.resultSymbolMatrix);
        const blankSymbol = this.settings.Symbols.filter(symbol => symbol.Name === 'Blank');
        // Filter out symbols with Id of 0
        const filteredSymbols = this.settings.resultSymbolMatrix[0].filter(symbol => symbol !== blankSymbol[0].Id);
        filteredSymbols.forEach((element, index) => {
            console.log(index);
            const symbolPayout = this.settings.Symbols.filter(symbol => symbol.Id === element);
            payoutSheet.push(symbolPayout[0].payout);
            console.log("symbolPayout[0].canCallRespin", symbolPayout[0].canCallRespin, " INDEX", index, " LAST INDEX ", this.settings.lastReSpin.Index, element);
            //  if(symbolPayout[0].canCallRespin && this.settings.resultSymbolMatrix[0][this.settings.lastReSpin.Index] !=  this.settings.lastReSpin.Symbol)
            //  {
            //    this.settings.resultSymbolMatrix[0][index] = element;
            //   console.log("CALLLEDD FREE SPIN");
            //   this.settings.lastReSpin  = {Index :index, Symbol : element};
            //   this.checkResult();
            //   }
            // if(this.settings.matrix.x >= 2 && symbolPayout[0].canCallRedSpin  && this.settings.resultSymbolMatrix[0][this.settings.lastReSpin.Index] !=  this.settings.lastReSpin.Symbol)
            // {
            //   const canCallRedSpin = this.isRandomNumberGreaterThan(90);
            //   if(canCallRedSpin)
            //   {
            //     new RandomResultGenerator(this);
            //     this.settings.resultSymbolMatrix[0][index] = element;
            //     console.log("CALLLEDD RED SPIN");
            //     this.settings.lastRedSpin  = {Index :index, Symbol : element};
            //     this.checkResult();
            //   }
            // }
        });
        const payout = parseInt(payoutSheet.map(num => num.toString()).join(''));
        console.log("Payout : ", payout || 0);
        // Convert the sum to a string and return it
        //REDSPINNNNN
        if (payout > 0 && payout <= 5 && this.settings.matrix.x >= 2) {
            payoutSheet.forEach((payoutSymbol, index) => {
                const symbolPayout = this.settings.Symbols.find(symbol => symbol.Id === payoutSymbol);
                if (symbolPayout[0].canCallRedSpin && this.settings.resultSymbolMatrix[0][this.settings.lastReSpin.Index] != this.settings.lastReSpin.Symbol) {
                    this.settings.resultSymbolMatrix[0][index] = payoutSymbol;
                    console.log("CALLLEDD FREE SPIN");
                    this.settings.lastRedSpin = { Index: index, Symbol: payoutSymbol };
                    this.checkResult();
                }
            });
        }
        //RESPINNNNN
        if (payout == 0) {
            payoutSheet.forEach((payoutSymbol, index) => {
                const symbolPayout = this.settings.Symbols.find(symbol => symbol.Id === payoutSymbol);
                if (symbolPayout[0].canCallRespin && this.settings.resultSymbolMatrix[0][this.settings.lastReSpin.Index] != this.settings.lastReSpin.Symbol) {
                    this.settings.resultSymbolMatrix[0][index] = payoutSymbol;
                    console.log("CALLLEDD FREE SPIN");
                    this.settings.lastReSpin = { Index: index, Symbol: payoutSymbol };
                    this.checkResult();
                }
            });
        }
        // console.log("Result : ", result);
        // console.log( this.settings.currentGamedata.Symbols)
    }
    initialize(gameData) {
        this.settings.currentGamedata = gameData;
        this.settings._winData = new WinData_1.WinData(this);
        gameUtils_1.UiInitData.paylines = (0, gameUtils_1.convertSymbols)(this.settings.currentGamedata.Symbols);
        this.sendInitdata();
    }
    sendInitdata() {
        this.settings.reels = this.generateInitialreel();
        const dataToSend = {
            GameData: {
                Reel: this.settings.reels,
                Bets: this.settings.currentGamedata.bets,
                autoSpin: [1, 5, 10, 20],
            },
            UIData: gameUtils_1.UiInitData,
            PlayerData: {
                Balance: this.getPlayerData().credits,
                haveWon: this.playerData.haveWon,
                currentWining: this.playerData.currentWining,
                totalbet: this.playerData.totalbet,
            },
        };
        this.sendMessage("InitData", dataToSend);
    }
    generateInitialreel() {
        const reels = [[], [], []]; // Initialize three empty reels
        this.settings.currentGamedata.Symbols.forEach(symbol => {
            for (let i = 0; i < 3; i++) {
                const count = symbol.reelInstance[i] || 0;
                for (let j = 0; j < count; j++) {
                    reels[i].push(symbol.Id); // Add the symbol's name to the specific reel
                }
            }
        });
        // 
        // Shuffle each reel individually
        reels.forEach(reel => {
            for (let i = reel.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [reel[i], reel[j]] = [reel[j], reel[i]]; // Swap elements within the same reel
            }
        });
        return reels;
    }
    get initSymbols() {
        const Symbols = []; // Explicitly declare Symbols as an array of Symbol objects
        this.currentGameData.gameSettings.Symbols.forEach((Element) => {
            // const element : Symbol = { 
            //   Element.Name.toString(),
            //   Element.Id,
            //   Element.payout,
            //   Element.canCallRedSpin,
            //   Element.canCallRespin,
            //   Element.reelInstance
            // };
            // Symbols.push(
            // );
        });
        return Symbols;
    }
    isRandomNumberGreaterThan(percentage) {
        // Generate a random number, either 0 or 1
        const randomNumber = Math.floor(Math.random() * 2);
        // Compare the random number with the threshold and return the result
        return randomNumber > percentage / 100;
    }
}
exports.SLCM = SLCM;
