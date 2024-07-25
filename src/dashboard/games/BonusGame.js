"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BonusGame = void 0;
const gameUtils_1 = require("./gameUtils");
class BonusGame {
    constructor(nosOfItem, parent) {
        this.noOfItems = nosOfItem;
        this.type = gameUtils_1.bonusGameType.default;
        this.result = [];
        this.parent = parent;
    }
    generateData(totalPay = 0) {
        this.result = [];
        let res = [];
        this.result = this.parent.settings.currentGamedata.bonus.payOut;
        if (this.parent.settings.bonus.start && this.parent.settings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.tap)
            this.shuffle(this.result);
        for (let i = 0; i < this.result.length; i++) {
            res.push(this.result[i].toString());
        }
        return res;
    }
    generateSlotData(reps = 0) {
        let res = [];
        let slot_array = [];
        let multiplier_array = [];
        slot_array.push(1);
        slot_array.push(2);
        slot_array.push(1);
        let reelNum = 1;
        if (!slot_array.includes(reelNum)) {
            reelNum = -1;
        }
        slot_array.forEach((element) => {
            if (element === reelNum)
                multiplier_array.push(this.parent.settings.currentGamedata.bonus.payTable[element]);
            else
                multiplier_array.push(0);
        });
        this.result = [...slot_array, reelNum, ...multiplier_array];
        for (let i = 0; i < this.result.length; i++) {
            res.push(this.result[i].toString());
        }
        return res;
    }
    setRandomStopIndex() {
        let amount = 0;
        if (this.parent.settings.bonus.start && this.parent.settings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.spin) {
            this.parent.settings.bonus.stopIndex = this.getRandomPayoutIndex(this.parent.settings.currentGamedata.bonus.payOutProb);
            amount = this.parent.settings.BetPerLines * this.result[this.parent.settings.bonus.stopIndex];
        }
        else if (this.parent.settings.bonus.start && this.parent.settings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.tap) {
            for (let index = 0; index < this.result.length; index++) {
                if (this.result[index] == 0)
                    break;
                else
                    amount += this.parent.settings.BetPerLines * this.result[index];
            }
        }
        else if (this.parent.settings.bonus.start && this.parent.settings.currentGamedata.bonus.type == "slot") {
            for (let index = 1; index < 4; index++) {
                amount += this.parent.settings.BetPerLines * this.result[this.result.length - index];
            }
            console.log("amount", amount);
            console.log("current bet", this.parent.settings.BetPerLines);
        }
        if (!amount || amount < 0)
            amount = 0;
        return amount;
    }
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let k = array[i];
            array[i] = array[j];
            array[j] = k;
        }
    }
    getRandomPayoutIndex(payOutProb) {
        const totalProb = payOutProb.reduce((sum, prob) => sum + prob, 0);
        const normalizedProb = payOutProb.map(prob => prob / totalProb);
        const cumulativeProb = [];
        normalizedProb.reduce((acc, prob, index) => {
            cumulativeProb[index] = acc + prob;
            return cumulativeProb[index];
        }, 0);
        console.log("cumulative array", cumulativeProb);
        const randomNum = Math.random();
        for (let i = 0; i < cumulativeProb.length; i++) {
            if (randomNum <= cumulativeProb[i]) {
                return i;
            }
        }
        return cumulativeProb.length - 1;
    }
}
exports.BonusGame = BonusGame;
