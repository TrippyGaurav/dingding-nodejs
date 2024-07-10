"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bonusGame = void 0;
const global_1 = require("./global");
const gameUtils_1 = require("./gameUtils");
class bonusGame {
    constructor(nosOfItem, clientId) {
        this.noOfItems = nosOfItem;
        this.type = gameUtils_1.bonusGameType.default;
        this.result = [];
        this.clientId = clientId;
        // this.noise=noise;
    }
    generateData(totalPay = 0) {
        this.result = [];
        let res = [];
        // for (let i = 0; i < gameSettings.currentGamedata.bonus.payOut; i++) {
        //    this.result.push(gameSettings.currentGamedata.bonus.payOut[i]);
        // }
        this.result = global_1.gameSettings.currentGamedata.bonus.payOut;
        // this.shuffle(this.result);
        console.log("bonus result", this.result);
        // let sum = 0;
        // this.totalPay=totalPay;
        // this.maxPay=Math.floor(totalPay*0.5);
        // let part=Math.floor((this.totalPay-this.maxPay)/(this.noOfItems-2));
        // this.noise=Math.floor(part/(this.noOfItems-2));
        // for (let i = 0; i < this.noOfItems-2; i++) {
        //         this.result.push(part);
        //         sum+=part;
        // }
        // for (let i = 0; i < this.result.length; i++) {
        //     let min=this.noise*i >0? this.noise*i: this.noise;
        //     let max=this.noise*(i+1);
        //     let j = this.result.length-1-i;
        //     let deviation=Math.floor(  Math.random()*(max -min) +min );
        //     this.result[i]-=deviation;
        //     this.result[j]+=deviation;
        // }
        // let diff=this.totalPay-this.maxPay-sum;
        // this.result[Math.floor(Math.random()*res.length)]+=diff;
        // this.result.push(-1);
        // this.result.push(this.maxPay);
        // this.shuffle(this.result);
        for (let i = 0; i < this.result.length; i++) {
            res.push(this.result[i].toString());
        }
        return res;
    }
    generateSlotData(reps = 0) {
        let res = [];
        let slot_array = [];
        let multiplier_array = [];
        // for (let index = 0; index < 3; index++) {
        //     slot_array.push(Math.floor(Math.random()*12));
        // }
        slot_array.push(1);
        slot_array.push(2);
        slot_array.push(1);
        //    let reelNum: number=Math.floor(Math.random()*12);
        let reelNum = 1;
        if (!slot_array.includes(reelNum)) {
            reelNum = -1;
        }
        slot_array.forEach((element) => {
            if (element === reelNum)
                multiplier_array.push(global_1.gameSettings.currentGamedata.bonus.payTable[element]);
            else
                multiplier_array.push(0);
        });
        this.result = [...slot_array, reelNum, ...multiplier_array];
        for (let i = 0; i < this.result.length; i++) {
            res.push(this.result[i].toString());
        }
        return res;
    }
    // slotCalculation(){
    //     let slot_array: number[]=[];
    //     let multiplier_array: number[]=[];
    //     slot_array.push(1);
    //     slot_array.push(2);
    //     slot_array.push(1);
    //    let reelNum: number=5;
    //     if(!slot_array.includes(reelNum)){
    //         reelNum=-1;
    //     }
    //    slot_array.forEach((element)=>{
    //     if(element===reelNum)
    //         multiplier_array.push(gameSettings.currentGamedata.bonus.payTable[element]);
    //     else 
    //         multiplier_array.push(0);
    //    })
    //    return [...slot_array,reelNum,...multiplier_array]
    // }
    setRandomStopIndex() {
        let amount = 0;
        if (global_1.gameSettings.bonus.start && global_1.gameSettings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.spin) {
            global_1.gameSettings.bonus.stopIndex = this.getRandomPayoutIndex(global_1.gameSettings.currentGamedata.bonus.payOutProb);
            amount = global_1.gameSettings.BetPerLines * this.result[global_1.gameSettings.bonus.stopIndex];
            console.log("bonus amount", amount);
            console.log("bonus index", global_1.gameSettings.bonus.stopIndex);
            console.log("bonus result", this.result[global_1.gameSettings.bonus.stopIndex]);
        }
        else if (global_1.gameSettings.bonus.start && global_1.gameSettings.currentGamedata.bonus.type == gameUtils_1.bonusGameType.tap) {
            // gameSettings.bonus.stopIndex=-1;   
            this.shuffle(this.result);
            this.result.forEach((element) => {
                if (element <= 0)
                    return;
                amount += global_1.gameSettings.BetPerLines * element;
            });
        }
        else if (global_1.gameSettings.bonus.start && global_1.gameSettings.currentGamedata.bonus.type == "slot") {
            // gameSettings.bonus.stopIndex=-1;
            for (let index = 1; index < 4; index++) {
                amount += global_1.gameSettings.BetPerLines * this.result[this.result.length - index];
            }
            // amount=gameSettings.currentBet*this.result[this.result.length-1];
            console.log("amount", amount);
            console.log("current bet", global_1.gameSettings.BetPerLines);
        }
        if (!amount || amount < 0)
            amount = 0;
        // gameSettings.bonus.stopIndex = -1;
        return amount;
        // playerData.Balance += amount;
        // playerData.haveWon += amount;
        // playerData.currentWining=amount;
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
        // Normalize the probabilities to sum up to 1
        const normalizedProb = payOutProb.map(prob => prob / totalProb);
        const cumulativeProb = [];
        normalizedProb.reduce((acc, prob, index) => {
            cumulativeProb[index] = acc + prob;
            return cumulativeProb[index];
        }, 0);
        console.log("cuulative array", cumulativeProb);
        const randomNum = Math.random();
        // Find the index based on the random number and cumulative probabilities
        for (let i = 0; i < cumulativeProb.length; i++) {
            if (randomNum <= cumulativeProb[i]) {
                return i;
            }
        }
        // Fallback in case of rounding errors
        return cumulativeProb.length - 1;
    }
}
exports.bonusGame = bonusGame;
