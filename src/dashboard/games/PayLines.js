"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ComboCounter_1 = __importDefault(require("./ComboCounter"));
const gameUtils_1 = require("./gameUtils");
class PayLines {
    constructor(line, pay, freeSpins, wild, currentGame) {
        this.line = line;
        this.pay = pay;
        this.freeSpins = freeSpins;
        this.useWildInFirstPosition = false;
        this.wild = wild;
        this.currentGame = currentGame;
    }
    getWildLines() {
        let res = [];
        if (!this.currentGame.settings.useWild)
            return res;
        let wPoss = this.getPositionsForWild();
        const maxWildsCount = this.useWildInFirstPosition
            ? wPoss.length - 1
            : wPoss.length;
        let minWildsCount = 1;
        let maxCounterValues = [];
        wPoss.forEach((p) => {
            maxCounterValues.push(1);
        });
        let cC = new ComboCounter_1.default(maxCounterValues);
        //HERE
        while (cC.nextCombo()) {
            let combo = cC.combo;
            let comboSum = cC.sum(); // count of wilds in combo
            if (comboSum >= minWildsCount && comboSum <= maxWildsCount) {
                let p = new PayLines(Array.from(this.line), this.pay, this.freeSpins, this.wild, this.currentGame);
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
        this.currentGame.settings.currentGamedata.Symbols.forEach((name) => {
            const data = {
                name: name.Name,
                Id: name.Id,
                useWildSub: name.useWildSub,
            };
            symbolsDict.push(data);
        });
        for (let i = 0; i < this.line.length; i++) {
            let sName = this.line[i];
            if (sName !== gameUtils_1.specialIcons.any && sName !== this.wild) {
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
exports.default = PayLines;
