"use strict";
// import { Alerts } from "./Alerts";
// import { sendMessageToClient } from "./App";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultType = exports.WinData = exports.PayLines = exports.CheckResult = void 0;
const _global_1 = require("./_global");
const slotUtils_1 = require("./slotUtils");
const slotTypes_1 = require("./slotTypes");
Object.defineProperty(exports, "ResultType", { enumerable: true, get: function () { return slotTypes_1.ResultType; } });
const Global_1 = require("../Global");
const userSocket_1 = require("../../socket/userSocket");
class CheckResult {
    constructor(playerSkt) {
        this.playerSkt = playerSkt;
        _global_1.slotGameSettings._winData = new WinData();
        this.scatter = slotTypes_1.specialIcons.scatter;
        this.useScatter = _global_1.slotGameSettings.useScatter && this.scatter !== null;
        this.jackpot = _global_1.slotGameSettings.jackpot;
        this.useJackpot = this.jackpot !== null;
        this.scatterPayTable = _global_1.slotGameSettings.scatterPayTable;
        this.bonusPaytable = _global_1.slotGameSettings.bonusPayTable;
        this.reels = _global_1.slotGameSettings.resultSymbolMatrix;
        console.log("SCATTER PAYTABLE : ", this.scatterPayTable);
        console.log("Bonus PAYTABLE : ", this.bonusPaytable);
        // this.scatterWin = [];
        // this.jackpotWin = [];
        // gameWining.WinningLines = [];
        // gameWining.winningSymbols = [];
        // gameWining.TotalWinningAmount = 0;
        this.scatterWinSymbols = [];
        this.jackpotWinSymbols = [];
        this.winSeq = null;
        this.bonusResult = [];
        this.searchWinSymbols();
    }
    searchWinSymbols() {
        console.log("search win symbols");
        // gameWining.freeSpins = 0;
        // gameWining.winningSymbols = [];
        // gameWining.WinningLines = [];
        // gameWining.TotalWinningAmount = 0;
        this.checkForWin();
        // this.checkForScatter();
        this.checkForBonus();
        this.checkForJackpot();
        // let excludeindex: number[] = [];
        // for (let i = 0; i < gameSettings._winData.winningSymbols.length; i++) {
        //     for (let j = i + 1; j < gameSettings._winData.winningSymbols.length; j++) {
        //         if (gameSettings._winData.winningSymbols[i].some(ai => gameSettings._winData.winningSymbols[j].includes(ai)))
        //             excludeindex.push(j);
        //     }
        // }
        // let excludeindexModified: number[] = excludeindex.filter((value, index, array) => array.indexOf(value) === index);
        // for (let i = excludeindexModified.length - 1; i >= 0; i--) {
        //     gameSettings._winData.winningSymbols.splice(excludeindexModified[i], 1);
        // }
        _global_1.slotGameSettings._winData.winningLines =
            _global_1.slotGameSettings._winData.winningLines.filter((value, index, array) => array.indexOf(value) === index);
        console.log("winning symbols", _global_1.slotGameSettings._winData.winningSymbols);
        _global_1.slotGameSettings._winData.updateBalance();
        console.log("result :", _global_1.slotGameSettings.resultSymbolMatrix);
        console.log("win data", _global_1.slotGameSettings._winData);
        console.log("Bonus start", _global_1.slotGameSettings.bonus.start);
        if (!_global_1.slotGameSettings.freeSpinStarted && _global_1.slotGameSettings._winData.freeSpins != 0)
            (0, slotUtils_1.startFreeSpin)(this.playerSkt);
        // Math.round(num * 100) / 100).toFixed(2)
        console.log("TOTAL WINING : " + _global_1.slotGameSettings._winData.totalWinningAmount);
        // console.log(gameWining.WinningLines);
        // console.log(gameWining.winningSymbols);
        console.log("PT BETS :" + _global_1.getCurrentRTP.playerTotalBets);
        // console.log(GData.playerSocket, "CurrentUserSocket")
        const winRate = (_global_1.getCurrentRTP.playerWon / _global_1.getCurrentRTP.playerTotalBets) * 100;
        console.log(`Total Spend : ${_global_1.getCurrentRTP.playerTotalBets}  Total Won : ${_global_1.getCurrentRTP.playerWon} 
      Current RTP : ${winRate.toFixed(2)}% `);
        console.log("_____________RESULT_END________________");
    }
    checkForBonus() {
        if (!_global_1.slotGameSettings.currentGamedata.bonus.isEnabled)
            return;
        let bonusSymbols = [];
        // gameSettings.totalBonuWinAmount=[];
        let temp = this.findSymbol(slotTypes_1.specialIcons.bonus);
        if (temp.length > 0)
            bonusSymbols.push(...temp);
        // console.log("paytable length",this.bonusPaytable.length);
        this.bonusPaytable.forEach((element) => {
            var _a;
            if (element.symbolCount > 0 &&
                bonusSymbols.length >= element.symbolCount) {
                // bonuswin = new WinData(bonusSymbols, 0, 0);
                _global_1.slotGameSettings._winData.winningSymbols.push(bonusSymbols);
                // gameSettings._winData.bonus=true;
                _global_1.slotGameSettings.bonus.start = true;
                _global_1.slotGameSettings.noOfBonus++;
                if (_global_1.slotGameSettings.currentGamedata.bonus.type == slotTypes_1.bonusGameType.tap)
                    this.bonusResult = _global_1.slotGameSettings.bonus.game.generateData((_a = _global_1.slotGameSettings.bonusPayTable[0]) === null || _a === void 0 ? void 0 : _a.pay);
                let temp = _global_1.slotGameSettings.bonus.game.setRandomStopIndex();
                _global_1.slotGameSettings.totalBonuWinAmount.push(temp);
                _global_1.slotGameSettings._winData.totalWinningAmount += temp;
            }
        });
    }
    checkForWin() {
        let allComboWin = [];
        _global_1.slotGameSettings.lineData.slice(0, _global_1.slotGameSettings.currentLines).forEach((lb, index) => {
            let win = null;
            console.log("Lines Index : :" + index);
            _global_1.slotGameSettings.fullPayTable.forEach((Payline) => {
                //  find max win (or win with max symbols count)
                const winTemp = this.getPayLineWin(Payline, lb, allComboWin);
                if (winTemp != null) {
                    if (win == null)
                        win = winTemp;
                    else {
                        if (win.Pay < winTemp.pay || win.FreeSpins < winTemp.freeSpins)
                            win = winTemp;
                    }
                    // gameWining.WinningLines.push(index);
                    _global_1.slotGameSettings._winData.winningLines.push(index);
                    console.log(`Line Index : ${index} : ` + lb + " - line win: " + win);
                }
            });
        });
        const filteredArray = this.checkforDuplicate(allComboWin);
        let BonusArray = [];
        filteredArray.forEach((element) => {
            _global_1.slotGameSettings._winData.winningSymbols.push(element.pos);
            // if(gameSettings.bonus.id>=0 && element.symbol==gameSettings.bonus.id.toString())
            //   BonusArray.push(element)
            _global_1.slotGameSettings._winData.totalWinningAmount +=
                element.pay * _global_1.slotGameSettings.BetPerLines;
            _global_1.slotGameSettings._winData.freeSpins += element.freeSpin;
        });
        //check for bonus
        // if(BonusArray.length>0){
        //     if (!gameSettings.currentGamedata.bonus.isEnabled)
        //         return;
        //     gameSettings.bonus.start = true;
        //  if (gameSettings.currentGamedata.bonus.type == bonusGameType.tap)
        //     this.bonusResult = gameSettings.bonus.game.generateData(gameSettings.bonusPayTable[0]?.pay);
        //     else if(gameSettings.currentGamedata.bonus.type=="slot")
        //     this.bonusResult = gameSettings.bonus.game.generateSlotData();
        //     gameSettings._winData.totalWinningAmount+=gameSettings.bonus.game.setRandomStopIndex();
        //     console.log("stop index2",gameSettings.bonus.stopIndex);
        // }
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
                    _global_1.slotGameSettings._winData.winningSymbols.push(this.scatterWinSymbols);
                    _global_1.slotGameSettings._winData.freeSpins += sPL.freeSpins;
                    _global_1.slotGameSettings._winData.totalWinningAmount += sPL.pay;
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
                _global_1.slotGameSettings._winData.winningSymbols.push(this.jackpotWinSymbols);
                _global_1.slotGameSettings._winData.totalWinningAmount += this.jackpot.defaultAmount;
                _global_1.slotGameSettings._winData.jackpotwin += this.jackpot.defaultAmount;
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
            if (payLine.line[i] !== slotTypes_1.specialIcons.any && s !== payLine.line[i]) {
                return;
            }
            else if (payLine.line[i] !== slotTypes_1.specialIcons.any &&
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
        for (let i = 0; i < _global_1.slotGameSettings.matrix.y; i++) {
            const symbol = _global_1.slotGameSettings.resultSymbolMatrix[i][index];
            symbolsOnGrid.push(symbol);
        }
        return symbolsOnGrid;
    }
    getIndexForResult(index) {
        for (let i = 0; i < _global_1.slotGameSettings.matrix.y; i++) {
            let symbolIndex = index.toString() + "," + i.toString();
            return symbolIndex;
        }
    }
    findSymbol(SymbolName) {
        let symbolId = -1;
        let foundArray = [];
        _global_1.slotGameSettings.currentGamedata.Symbols.forEach((element) => {
            if (SymbolName == element.Name)
                symbolId = element.Id;
        });
        for (let i = 0; i < _global_1.slotGameSettings.resultSymbolMatrix.length; i++) {
            for (let j = 0; j < _global_1.slotGameSettings.resultSymbolMatrix[i].length; j++) {
                if (_global_1.slotGameSettings.resultSymbolMatrix[i][j] == symbolId.toString())
                    foundArray.push(j.toString() + "," + i.toString());
            }
        }
        return foundArray;
    }
    makeResultJson(playerSkt, isResult, iconsToFill = []) {
        //TODO : Try to send the jackpot win data without initializie a variable;
        _global_1.slotGameSettings._winData.totalWinningAmount =
            Math.round(_global_1.slotGameSettings._winData.totalWinningAmount * 100) / 100;
        const ResultData = {
            GameData: {
                ResultReel: _global_1.slotGameSettings.resultSymbolMatrix,
                linesToEmit: _global_1.slotGameSettings._winData.winningLines,
                symbolsToEmit: (0, slotUtils_1.removeRecurringIndexSymbols)(_global_1.slotGameSettings._winData.winningSymbols),
                WinAmout: _global_1.slotGameSettings._winData.totalWinningAmount,
                freeSpins: _global_1.slotGameSettings._winData.freeSpins,
                jackpot: _global_1.slotGameSettings._winData.jackpotwin,
                isBonus: _global_1.slotGameSettings.bonus.start,
                BonusStopIndex: _global_1.slotGameSettings.bonus.stopIndex,
                BonusResult: this.bonusResult,
            },
            PlayerData: Global_1.PlayerData,
        };
        Global_1.GData.playerSocket.updateCreditsInDb();
        if (isResult == slotTypes_1.ResultType.normal)
            (0, userSocket_1.sendMessage)(playerSkt, "ResultData", ResultData);
        if (isResult == slotTypes_1.ResultType.moolah) {
            ResultData.GameData['iconstoFill'] = iconsToFill;
            (0, userSocket_1.sendMessage)(playerSkt, "MoolahResultData", ResultData);
        }
    }
    // return symbols from windows
    getWindowsSymbols(reel) {
        let vSymbols = [];
        for (let si = 0; si < _global_1.slotGameSettings.matrix.y; si++) {
            const order = si;
            vSymbols.push(_global_1.slotGameSettings.resultSymbolMatrix[reel]);
        }
        return vSymbols;
    }
}
exports.CheckResult = CheckResult;
// Helper class to make combinations
class ComboCounter {
    constructor(maxCounterValues // positions [max Val0, max Val1, max Val2, ...]
    ) {
        this.maxCounterValues = maxCounterValues;
        this.combo = [];
        this.maxCounterValues.forEach((p) => {
            this.combo.push(0);
        });
        this.firstCombo = true;
    }
    nextCombo() {
        if (this.firstCombo) {
            this.firstCombo = false;
            return true;
        }
        for (let i = this.maxCounterValues.length - 1; i >= 0; i--) {
            if (this.combo[i] < this.maxCounterValues[i]) {
                this.combo[i]++;
                if (i != this.maxCounterValues.length - 1) {
                    // reset low "bits"
                    for (var j = i + 1; j < this.maxCounterValues.length; j++) {
                        this.combo[j] = 0;
                    }
                }
                return true;
            }
        }
        return false;
    }
    sum() {
        let s = 0;
        this.combo.forEach((ci) => {
            s += ci;
        });
        return s;
    }
    getComboCounts() {
        let counts = 1;
        this.maxCounterValues.forEach((p) => {
            if (p != 0)
                counts *= p;
        });
    }
}
class PayLines {
    constructor(line, pay, freeSpins, wild) {
        this.line = line;
        this.pay = pay;
        this.freeSpins = freeSpins;
        this.useWildInFirstPosition = false;
        this.wild = wild;
    }
    getWildLines() {
        let res = [];
        if (!_global_1.slotGameSettings.useWild)
            return res; // return empty list
        let wPoss = this.getPositionsForWild();
        const maxWildsCount = this.useWildInFirstPosition
            ? wPoss.length - 1
            : wPoss.length;
        let minWildsCount = 1;
        let maxCounterValues = [];
        wPoss.forEach((p) => {
            maxCounterValues.push(1);
        });
        let cC = new ComboCounter(maxCounterValues);
        while (cC.nextCombo()) {
            let combo = cC.combo;
            let comboSum = cC.sum(); // count of wilds in combo
            if (comboSum >= minWildsCount && comboSum <= maxWildsCount) {
                let p = new PayLines(Array.from(this.line), this.pay, this.freeSpins, this.wild);
                for (let i = 0; i < wPoss.length; i++) {
                    let pos = wPoss[i];
                    if (combo[i] == 1) {
                        p.line[pos] = this.wild;
                    }
                }
                if (!this.isEqual(p) && !this.containEqualLine(res, p))
                    res.push(p);
            }
        }
        return res;
    }
    getPositionsForWild() {
        var _a;
        let wPoss = [];
        let counter = 0;
        let symbolsDict = [];
        _global_1.slotGameSettings.currentGamedata.Symbols.forEach((name) => {
            const data = {
                name: name.Name,
                Id: name.Id,
                useWildSub: name.useWildSub,
            };
            symbolsDict.push(data);
        });
        for (let i = 0; i < this.line.length; i++) {
            let sName = this.line[i];
            if (sName !== slotTypes_1.specialIcons.any && sName !== this.wild) {
                if (!this.useWildInFirstPosition && counter == 0) {
                    // don't use first
                    counter++;
                }
                else {
                    if ((_a = symbolsDict[sName]) === null || _a === void 0 ? void 0 : _a.useWildSub)
                        wPoss.push(i);
                    counter++;
                }
            }
        }
        return wPoss;
    }
    isEqual(pLine) {
        if (pLine === null)
            return false;
        if (pLine.line === null)
            return false;
        if (this.line.length != pLine.line.length)
            return false;
        for (let i = 0; i < this.line.length; i++) {
            if (this.line[i] !== pLine.line[i])
                return false;
        }
        return true;
    }
    containEqualLine(pList, pLine) {
        if (pList == null)
            return false;
        if (pLine == null)
            return false;
        if (pLine.line == null)
            return false;
        for (let i = 0; i < pList.length; i++) {
            if (pList[i].isEqual(pLine))
                return true;
        }
        return false;
    }
}
exports.PayLines = PayLines;
class WinData {
    constructor() {
        this.resultReelIndex = [];
        this.freeSpins = 0;
        this.winningLines = [];
        this.winningSymbols = [];
        this.totalWinningAmount = 0;
        this.jackpotwin = 0;
    }
    updateBalance() {
        // gameWining.TotalWinningAmount += this.pay;
        Global_1.GData.playerSocket.updatePlayerBalance(this.totalWinningAmount);
        _global_1.getCurrentRTP.playerWon += this.totalWinningAmount;
        console.log("BETS " + _global_1.slotGameSettings.currentBet);
        if (!_global_1.slotGameSettings.freeSpinStarted)
            _global_1.getCurrentRTP.playerTotalBets += _global_1.slotGameSettings.currentBet;
        else
            _global_1.getCurrentRTP.playerTotalBets += 0;
    }
}
exports.WinData = WinData;
