"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckResult = void 0;
const WinData_1 = require("./WinData");
const gameUtils_1 = require("./gameUtils");
const RandomResultGenerator_1 = require("./RandomResultGenerator");
const gameUtils_2 = require("./gameUtils");
class CheckResult {
    constructor(current) {
        current.settings._winData = new WinData_1.WinData(current);
        this.currentGame = current;
        this.scatter = gameUtils_1.specialIcons.scatter;
        this.useScatter = current.settings.useScatter && this.scatter !== null;
        this.jackpot = current.settings.jackpot;
        this.useJackpot = this.jackpot !== null;
        this.scatterPayTable = current.settings.scatterPayTable;
        this.bonusPaytable = current.settings.bonusPayTable;
        this.reels = current.settings.resultSymbolMatrix;
        // console.log("SCATTER PAYTABLE : ", this.scatterPayTable);
        // console.log("Bonus PAYTABLE : ", this.bonusPaytable);
        this.scatterWinSymbols = [];
        this.jackpotWinSymbols = [];
        this.winSeq = null;
        this.bonusResult = [];
        this.searchWinSymbols();
    }
    searchWinSymbols() {
        // console.log("search win symbols");
        this.checkForWin();
        this.checkForBonus();
        this.checkForJackpot();
        this.currentGame.settings._winData.winningLines =
            this.currentGame.settings._winData.winningLines.filter((value, index, array) => array.indexOf(value) === index);
        console.log("winning symbols", this.currentGame.settings._winData.winningSymbols);
        this.currentGame.settings._winData.updateBalance();
        console.log("result :", this.currentGame.settings.resultSymbolMatrix);
        // console.log("win data", this.currentGame.settings._winData);
        console.log("Bonus start", this.currentGame.settings.bonus.start);
        if (!this.currentGame.settings.freeSpinStarted && this.currentGame.settings._winData.freeSpins != 0)
            this.startFreeSpin();
        console.log("TOTAL WINING : " + this.currentGame.settings._winData.totalWinningAmount);
        console.log("PT BETS :" + this.currentGame.settings.currentBet);
        const winRate = (this.currentGame.player.currentWining / this.currentGame.settings.currentBet) * 100;
        console.log(`Total Spend : ${this.currentGame.settings.currentBet}  Total Won : ${this.currentGame.player.currentWining} 
        Current RTP : ${winRate.toFixed(2)}% `);
        console.log("_____________RESULT_END________________");
    }
    checkForBonus() {
        if (!this.currentGame.settings.currentGamedata.bonus.isEnabled)
            return;
        if (this.currentGame.settings.freeSpinStarted)
            return;
        let bonusSymbols = [];
        let temp = this.findSymbol(gameUtils_1.specialIcons.bonus);
        if (temp.length > 0)
            bonusSymbols.push(...temp);
        this.bonusPaytable.forEach((element) => {
            if (element.symbolCount > 0 &&
                bonusSymbols.length >= element.symbolCount) {
                this.currentGame.settings._winData.winningSymbols.push(bonusSymbols);
                this.currentGame.settings.bonus.start = true;
                this.currentGame.settings.noOfBonus++;
                if (this.currentGame.settings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.tap)
                    this.bonusResult = this.currentGame.settings.bonus.game.generateData();
                this.currentGame.settings._winData.totalWinningAmount += this.currentGame.settings.bonus.game.setRandomStopIndex();
            }
            else {
                if (this.currentGame.settings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.spin)
                    this.currentGame.settings.bonus.stopIndex = -1;
            }
        });
    }
    checkForWin() {
        let allComboWin = [];
        this.currentGame.settings.lineData.slice(0, this.currentGame.settings.currentLines).forEach((lb, index) => {
            let win = null;
            // console.log("Lines Index : :" + index);
            this.currentGame.settings.fullPayTable.forEach((Payline) => {
                //  find max win (or win with max symbols count)
                const winTemp = this.getPayLineWin(Payline, lb, allComboWin);
                if (winTemp != null) {
                    if (win == null)
                        win = winTemp;
                    else {
                        if (win.Pay < winTemp.pay || win.FreeSpins < winTemp.freeSpins)
                            win = winTemp;
                    }
                    this.currentGame.settings._winData.winningLines.push(index);
                    console.log(`Line Index : ${index} : ` + lb + " - line win: " + win);
                }
            });
        });
        const filteredArray = this.checkforDuplicate(allComboWin);
        let BonusArray = [];
        filteredArray.forEach((element) => {
            this.currentGame.settings._winData.winningSymbols.push(element.pos);
            this.currentGame.settings._winData.totalWinningAmount +=
                element.pay * this.currentGame.settings.BetPerLines;
            this.currentGame.settings._winData.freeSpins += element.freeSpin;
        });
    }
    checkforDuplicate(allComboWin) {
        allComboWin.sort((a, b) => b.pos.length - a.pos.length);
        const filteredArray = [];
        for (const currentItem of allComboWin) {
            const isSubsetOfAny = filteredArray.some((item) => item.symbol === currentItem.symbol &&
                this.isSubset(currentItem.pos, item.pos));
            if (!isSubsetOfAny) {
                filteredArray.push(currentItem);
            }
        }
        return filteredArray;
    }
    isSubset(subset, superset) {
        const supersetSet = new Set(superset);
        return subset.every((elem) => supersetSet.has(elem));
    }
    checkForScatter() {
        this.scatterWinSymbols = [];
        // this.scatterWin = null;
        if (this.useScatter) {
            // console.log("scattersds", this.scatter);
            let temp = this.findSymbol(this.scatter);
            if (temp.length > 0)
                this.scatterWinSymbols.push(...temp);
            this.scatterPayTable.forEach((sPL) => {
                if (sPL.symbolCount > 0 &&
                    sPL.symbolCount == this.scatterWinSymbols.length) {
                    this.currentGame.settings._winData.winningSymbols.push(this.scatterWinSymbols);
                    this.currentGame.settings._winData.freeSpins += sPL.freeSpins;
                    this.currentGame.settings._winData.totalWinningAmount += sPL.pay;
                }
            });
            // if (this.scatterWin == null) this.scatterWinSymbols = [];
        }
    }
    checkForJackpot() {
        // this.jackpotWinSymbols = [];
        // this.jackpotWin = [];
        if (this.useJackpot) {
            var temp = this.findSymbol(this.jackpot.symbolName);
            if (temp.length > 0)
                this.jackpotWinSymbols.push(...temp);
            // console.log('find Jackpot symbols: ' + this.jackpotWinSymbols);
            if (this.jackpot.symbolsCount > 0 &&
                this.jackpot.symbolsCount == this.jackpotWinSymbols.length) {
                this.currentGame.settings._winData.winningSymbols.push(this.jackpotWinSymbols);
                this.currentGame.settings._winData.totalWinningAmount += this.jackpot.defaultAmount;
                this.currentGame.settings._winData.jackpotwin += this.jackpot.defaultAmount;
                //TODO :ADD JACKPOT WIN PAYMENT FOR THE FINAL JSON (done)
            }
        }
    }
    getPayLineWin(payLine, lineData, allComboWin) {
        if (payLine == null)
            return null;
        let master = [];
        let winSymbols = [];
        for (let i = 0; i < lineData.length; i++) {
            let tempWinSymbols = {
                pos: [],
                symbol: "",
                pay: 0,
                freeSpin: 0,
            };
            const symbol = this.getSymbolOnMatrix(i);
            const s = symbol[lineData[i]];
            tempWinSymbols.symbol = s;
            if (payLine.line[i] !== gameUtils_1.specialIcons.any && s !== payLine.line[i]) {
                return;
            }
            else if (payLine.line[i] !== gameUtils_1.specialIcons.any &&
                s === payLine.line[i]) {
                const symbolIndex = i.toString() + "," + lineData[i].toString();
                winSymbols.push(symbolIndex);
                // gameSettings._winData.winningSymbols.push(symbolIndex);
                tempWinSymbols.pos.push(symbolIndex);
                tempWinSymbols.pay = payLine.pay;
                tempWinSymbols.freeSpin = payLine.freeSpins;
            }
            master.push(tempWinSymbols);
        }
        // gameSettings._winData.winningSymbols.push(winSymbols);
        const filteredArray = master.filter((item) => item.pos.length > 0);
        const groupedBySymbol = filteredArray.reduce((acc, item) => {
            if (!acc[item.symbol]) {
                acc[item.symbol] = {
                    symbol: item.symbol,
                    pos: [],
                    pay: item.pay,
                    freeSpin: item.freeSpin,
                };
            }
            acc[item.symbol].pos = acc[item.symbol].pos.concat(item.pos);
            return acc;
        }, {});
        // Step 3: Convert the grouped object back into an array of objects
        const mergedArray = Object.values(groupedBySymbol);
        if (!payLine.pay)
            payLine.pay = 0;
        allComboWin.push(...mergedArray);
        // gameSettings._winData.freeSpins += payLine.freeSpins;
        // gameSettings._winData.totalWinningAmount += payLine.pay
        // const winData=new WinData(winSymbols, payLine.freeSpins, payLine.pay);
        return { freeSpins: payLine.freeSpins, pay: payLine.pay };
    }
    getSymbolOnMatrix(index) {
        let symbolsOnGrid = [];
        for (let i = 0; i < this.currentGame.settings.matrix.y; i++) {
            const symbol = this.currentGame.settings.resultSymbolMatrix[i][index];
            symbolsOnGrid.push(symbol);
        }
        return symbolsOnGrid;
    }
    getIndexForResult(index) {
        for (let i = 0; i < this.currentGame.settings.matrix.y; i++) {
            let symbolIndex = index.toString() + "," + i.toString();
            return symbolIndex;
        }
    }
    findSymbol(SymbolName) {
        let symbolId = -1;
        let foundArray = [];
        this.currentGame.settings.currentGamedata.Symbols.forEach((element) => {
            if (SymbolName == element.Name)
                symbolId = element.Id;
        });
        for (let i = 0; i < this.currentGame.settings.resultSymbolMatrix.length; i++) {
            for (let j = 0; j < this.currentGame.settings.resultSymbolMatrix[i].length; j++) {
                if (this.currentGame.settings.resultSymbolMatrix[i][j] == symbolId.toString())
                    foundArray.push(j.toString() + "," + i.toString());
            }
        }
        return foundArray;
    }
    makeResultJson(isResult, iconsToFill = []) {
        //TODO : Try to send the jackpot win data without initializie a variable;
        this.currentGame.settings._winData.totalWinningAmount =
            Math.round(this.currentGame.settings._winData.totalWinningAmount * 100) / 100;
        const ResultData = {
            GameData: {
                ResultReel: this.currentGame.settings.resultSymbolMatrix,
                linesToEmit: this.currentGame.settings._winData.winningLines,
                symbolsToEmit: this.removeRecurringIndexSymbols(this.currentGame.settings._winData.winningSymbols),
                WinAmout: this.currentGame.settings._winData.totalWinningAmount,
                freeSpins: this.currentGame.settings._winData.freeSpins,
                jackpot: this.currentGame.settings._winData.jackpotwin,
                isBonus: this.currentGame.settings.bonus.start,
                BonusStopIndex: this.currentGame.settings.bonus.stopIndex,
                BonusResult: this.bonusResult,
            },
            PlayerData: {
                Balance: this.currentGame.player.credits,
                haveWon: this.currentGame.player.haveWon,
                currentWining: this.currentGame.player.currentWining
            }
        };
        this.currentGame.updateDatabase();
        if (isResult == gameUtils_2.ResultType.normal)
            this.currentGame.sendMessage("ResultData", ResultData);
        if (isResult == gameUtils_2.ResultType.moolah) {
            ResultData.GameData['iconstoFill'] = iconsToFill;
            this.currentGame.sendMessage("MoolahResultData", ResultData);
        }
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
    // return symbols from windows
    getWindowsSymbols(reel) {
        let vSymbols = [];
        for (let si = 0; si < this.currentGame.settings.matrix.y; si++) {
            const order = si;
            vSymbols.push(this.currentGame.settings.resultSymbolMatrix[reel]);
        }
        return vSymbols;
    }
    startFreeSpin() {
        console.log("____----Started FREE SPIN ----_____" + " :::  FREE SPINSS ::::", this.currentGame.settings._winData.freeSpins);
        this.currentGame.sendMessage('StartedFreeSpin', {});
        this.currentGame.settings.freeSpinStarted = true;
        for (let i = 0; i <= this.currentGame.settings._winData.freeSpins; i++) {
            this.currentGame.settings.bonus.start = false;
            new RandomResultGenerator_1.RandomResultGenerator(this.currentGame);
            new CheckResult(this.currentGame);
            console.log("FREE SPINS LEFTTT ::::" + (this.currentGame.settings._winData.freeSpins - i));
        }
        this.currentGame.settings._winData.freeSpins = 0;
        this.currentGame.sendMessage("StoppedFreeSpins", {});
        this.currentGame.settings.freeSpinStarted = false;
        console.log("____----Stopped FREE SPIN ----_____");
    }
}
exports.CheckResult = CheckResult;
