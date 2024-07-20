import { bonusGameType } from "./gameUtils";
import SlotGame from "./slotGame";

export class BonusGame {
    type: String;
    noOfItems: number;
    totalPay: number;
    result: number[];
    noise: number;
    minPay: number;
    maxPay: number;
    clientId: string;
    parent: SlotGame

    constructor(nosOfItem: number, parent: SlotGame) {
        this.noOfItems = nosOfItem;
        this.type = bonusGameType.spin;
        this.result = [];
        this.clientId = parent.player.socket.id;
        this.parent = parent;
    }

    generateData(totalPay: number = 0): string[] {
        this.result = [];
        let res: string[] = [];

        this.result = this.parent.settings.currentGamedata.bonus.payOut;

        console.log("bonus result", this.result);

        for (let i = 0; i < this.result.length; i++) {
            res.push(this.result[i].toString());
        }

        return res;
    }

    generateSlotData(reps: number = 0): string[] {
        let res: string[] = [];
        let slot_array: number[] = [];
        let multiplier_array: number[] = [];

        slot_array.push(1);
        slot_array.push(2);
        slot_array.push(1);

        let reelNum: number = 1;

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
        let amount: number = 0;

        if (this.parent.settings.bonus.start && this.parent.settings.currentGamedata.bonus.type == bonusGameType.spin) {
            this.parent.settings.bonus.stopIndex = this.getRandomPayoutIndex(this.parent.settings.currentGamedata.bonus.payOutProb);
            amount = this.parent.settings.BetPerLines * this.result[this.parent.settings.bonus.stopIndex];
            console.log("bonus amount", amount);
            console.log("bonus index", this.parent.settings.bonus.stopIndex);
            console.log("bonus result", this.result[this.parent.settings.bonus.stopIndex]);
        } else if (this.parent.settings.bonus.start && this.parent.settings.currentGamedata.bonus.type == bonusGameType.tap) {
            this.shuffle(this.result);
            this.result.forEach((element) => {
                if (element <= 0)
                    return;
                amount += this.parent.settings.BetPerLines * element;
            });
        } else if (this.parent.settings.bonus.start && this.parent.settings.currentGamedata.bonus.type == "slot") {
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

    shuffle(array: number[]) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let k = array[i];
            array[i] = array[j];
            array[j] = k;
        }
    }

    getRandomPayoutIndex(payOutProb): number {
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