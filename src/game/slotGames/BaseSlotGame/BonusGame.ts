import { bonusGameType } from "../../Utils/gameUtils";
import SlotGame from "../slotGame";
import BaseSlotGame from "./BaseSlotGame";
import { MiniSpinBonus } from "./gameType";

export class BonusGame {
    type: String;
    noOfItems: number;
    totalPay: number;
    result: number[];
    noise: number;
    minPay: number;
    maxPay: number;
    parent: BaseSlotGame

    constructor(nosOfItem: number, parent: BaseSlotGame) {
        this.noOfItems = nosOfItem;
        this.type = bonusGameType.default;
        this.result = [];
        this.parent = parent;
    }

    generateData(totalPay: number = 0): string[] {
        this.result = [];
        let res: string[] = [];

        this.result = this.parent.settings.currentGamedata.bonus.payOut;

        if (this.parent.settings.bonus.start && this.parent.settings.currentGamedata.bonus.type == bonusGameType.tap)
            this.shuffle(this.result);

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


    runMiniSpin (   ) {
      console.log("run mini spin");
      //NOTE: fruity cocktail bonus game 

      //WARN: remove later
      // if(this.parent.settings.currentGamedata.bonus.noOfItem < 3) return 
      //
      // let lives = this.parent.settings.currentGamedata.bonus.noOfItem > 5 ? 
      //             3 :
      //             this.parent.settings.currentGamedata.bonus.noOfItem - 2;
      //TODO: - loop till lives  === 0
      //         - 1*3 matrix generation
      //         - rng on outer ring of symbols  
      //         - check no. of matching symbols for outer ring and 1*3 (matchCount)
      //         - add win amt based on matchCount 
      //         - check if rng on outer ring lands on exit symbol if so decrement lives
      //      - return total win amt

      // let totalWinAmount = 0;
  // let bonus = this.parent.settings.currentGamedata.bonus
    
      // const { symbols, miniSlotProb, outerRingProb, payout } = this.parent.settings.currentGamedata.bonus;
      //
      // // Helper function to get a random index based on probability array
      // const getRandomIndex = (probArray) => {
      //   const rand = Math.random() * 100;
      //   let sum = 0;
      //   for (let i = 0; i < probArray.length; i++) {
      //     sum += probArray[i];
      //     if (rand <= sum) return i;
      //   }
      //   return probArray.length - 1;
      // };
      //
      // // Main game loop
      // while (lives > 0) {
      //   // Generate 1x3 matrix
      //   const innerMatrix = Array(3).fill().map(() => symbols[getRandomIndex(miniSlotProb)]);
      //
      //   // Generate outer ring symbol
      //   const outerRingSymbol = symbols[getRandomIndex(outerRingProb)];
      //
      //   // Count matches between outer ring and inner matrix
      //   const matchCount = innerMatrix.filter(symbol => symbol === outerRingSymbol).length;
      //
      //   // Calculate and add win amount based on match count
      //   totalWinAmount += payout[matchCount];
      //
      //   // Check if outer ring landed on exit symbol (symbol id 7)
      //   if (outerRingSymbol === 7) {
      //     lives--;
      //   }
      //
      //   // You may want to add some visual feedback here, e.g.:
      //   console.log(`Inner Matrix: ${innerMatrix.join(', ')}`);
      //   console.log(`Outer Ring: ${outerRingSymbol}`);
      //   console.log(`Matches: ${matchCount}, Win: ${payout[matchCount]}`);
      //   console.log(`Lives remaining: ${lives}`);
      // }
      //
      // // Return total win amount
      // console.log(`Total Win Amount: ${totalWinAmount}`);
      // return totalWinAmount;
    }

    setRandomStopIndex() {
        let amount: number = 0;

        console.log("bonus: ", this.parent.settings.currentGamedata.bonus);
    
        if (this.parent.settings.bonus.start && this.parent.settings.currentGamedata.bonus.type == bonusGameType.spin) {
            this.parent.settings.bonus.stopIndex = this.getRandomPayoutIndex(this.parent.settings.currentGamedata.bonus.payOutProb);
            amount = this.parent.settings.BetPerLines * this.result[this.parent.settings.bonus.stopIndex];
         
        } else if (this.parent.settings.bonus.start && this.parent.settings.currentGamedata.bonus.type == bonusGameType.tap) {
            for (let index = 0; index < this.result.length; index++) {
                if (this.result[index] == 0)
                    break;
                else
                    amount += this.parent.settings.BetPerLines * this.result[index];
            }
        } else if (this.parent.settings.bonus.start && this.parent.settings.currentGamedata.bonus.type == "slot") {
            for (let index = 1; index < 4; index++) {
                amount += this.parent.settings.BetPerLines * this.result[this.result.length - index];
            }
            console.log("amount", amount);
            console.log("current bet", this.parent.settings.BetPerLines);
        }
        else if (this.parent.settings.bonus.start && this.parent.settings.currentGamedata.bonus.type == bonusGameType.layerTap) {
            let totalWinAmount = 0;
            const bonusData = this.parent.settings.currentGamedata.bonus;
            var selectedIndex =[];
            for (let layerIndex = 0; layerIndex < bonusData.payOut.length; layerIndex++) {
                
                const layerPayOuts = bonusData.payOut[layerIndex];
                const layerPayOutProb = bonusData.payOutProb[layerIndex];
                selectedIndex[layerIndex] = this.getRandomPayoutIndex(layerPayOutProb);
                const selectedPayOut = layerPayOuts[selectedIndex[layerIndex]];
                if (selectedPayOut === 0) {
                    console.log(`Payout is 0 at layer ${layerIndex}, exiting...`);
                    break;
                }
                totalWinAmount += this.parent.settings.BetPerLines * selectedPayOut;
            }
            console.log("Bonus Index",selectedIndex);
            amount += totalWinAmount;
        }
        if (!amount || amount < 0)
            amount = 0;
        
        return { selectedIndex, amount };
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

        

        const randomNum = Math.random();

        for (let i = 0; i < cumulativeProb.length; i++) {
            if (randomNum <= cumulativeProb[i]) {
                return i;
            }
        }

        return cumulativeProb.length - 1;
    }
}
