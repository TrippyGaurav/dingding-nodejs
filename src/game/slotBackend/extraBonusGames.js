"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GambleGame = exports.bonusGame = void 0;
const TestGlobal_1 = require("../TestGlobal");
const _global_1 = require("./_global");
// import { sendMessageToClient } from "./App";
const slotTypes_1 = require("./slotTypes");
const TestGlobal_2 = require("../TestGlobal");
const userSocket_1 = require("../../socket/userSocket");
class bonusGame {
    constructor(nosOfItem, clientId) {
        this.noOfItems = nosOfItem;
        this.type = slotTypes_1.bonusGameType.default;
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
        this.result = _global_1.slotGameSettings.currentGamedata.bonus.payOut;
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
                multiplier_array.push(_global_1.slotGameSettings.currentGamedata.bonus.payTable[element]);
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
        if (_global_1.slotGameSettings.bonus.start && _global_1.slotGameSettings.currentGamedata.bonus.type == slotTypes_1.bonusGameType.spin) {
            _global_1.slotGameSettings.bonus.stopIndex = this.getRandomPayoutIndex(_global_1.slotGameSettings.currentGamedata.bonus.payOutProb);
            amount = _global_1.slotGameSettings.BetPerLines * this.result[_global_1.slotGameSettings.bonus.stopIndex];
            console.log("bonus amount", amount);
            console.log("bonus index", _global_1.slotGameSettings.bonus.stopIndex);
            console.log("bonus result", this.result[_global_1.slotGameSettings.bonus.stopIndex]);
        }
        else if (_global_1.slotGameSettings.bonus.start && _global_1.slotGameSettings.currentGamedata.bonus.type == slotTypes_1.bonusGameType.tap) {
            // gameSettings.bonus.stopIndex=-1;   
            this.shuffle(this.result);
            this.result.forEach((element) => {
                if (element <= 0)
                    return;
                amount += _global_1.slotGameSettings.BetPerLines * element;
            });
        }
        else if (_global_1.slotGameSettings.bonus.start && _global_1.slotGameSettings.currentGamedata.bonus.type == "slot") {
            // gameSettings.bonus.stopIndex=-1;
            for (let index = 1; index < 4; index++) {
                amount += _global_1.slotGameSettings.BetPerLines * this.result[this.result.length - index];
            }
            // amount=gameSettings.currentBet*this.result[this.result.length-1];
            console.log("amount", amount);
            console.log("current bet", _global_1.slotGameSettings.BetPerLines);
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
class GambleGame {
    constructor(playerSkt, clientId, multiplier = 2) {
        this.playerSkt = playerSkt;
        this.clientId = clientId;
        this.multiplier = multiplier;
        this.gambleCount = 0;
        this.totalWining = 0;
        this.maxgambleCount = 5;
    }
    generateData(gambleAmount) {
        console.log("triggered in gamble");
        const num = Math.random();
        // if(num>0.5){
        //     gambleAmount*= this.multiplier;
        // }else{
        //     gambleAmount=0;
        //     gameSettings.gamble.start=false;
        //     // return;
        // }
        gambleAmount *= this.multiplier;
        // gambleAmount*=0;
        this.currentWining = gambleAmount;
        this.totalWining += gambleAmount;
        this.makeResultJson(this.clientId);
        this.gambleCount++;
        console.log("gamble amount", this.gambleCount);
    }
    makeResultJson(clientId) {
        // const totalWinningAmount = (Math.round(amount * 100) / 100)
        console.log("triggered in make resultjson");
        const ResultData = {
            GambleData: {
                currentWining: this.currentWining,
                totalWinningAmount: this.totalWining,
            },
            PlayerData: TestGlobal_2.PlayerData,
        };
        //TODO : ADD MESSAGE FOR CLIENT
        (0, userSocket_1.sendMessage)(this.playerSkt, "GambleResult", ResultData);
        // sendMessageToClient(clientId, "GambleResult", ResultData);
    }
    updateplayerBalance() {
        TestGlobal_1.GData.playerSocket.updatePlayerBalance(this.totalWining);
        this.makeResultJson(this.clientId);
    }
    reset() {
        this.gambleCount = 0;
        this.totalWining = 0;
        this.currentWining = 0;
        _global_1.slotGameSettings.gamble.game = null;
        _global_1.slotGameSettings.gamble.start = false;
    }
    checkIfClientExist(clients) {
        if (clients.has(this.clientId))
            return true;
        else
            return false;
    }
}
exports.GambleGame = GambleGame;
