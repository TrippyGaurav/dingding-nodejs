import { GData } from "../Global.";
import { slotGameSettings} from "./_global";
// import { sendMessageToClient } from "./App";
import { bonusGameType } from "./slotTypes";
import { PlayerData } from "../Global.";
export class bonusGame{
    type:String;
    noOfItems:number;
    totalPay:number;
    result:number[];
    noise:number;
    minPay:number;
    maxPay:number;
    clientId: string;

    constructor(nosOfItem:number, clientId: string) {
        this.noOfItems=nosOfItem;
        this.type= bonusGameType.default;
        this.result=[];
        this.clientId=clientId
        // this.noise=noise;
    }

    generateData( totalPay:number=0):string[] {
        
        this.result=[];
        let res: string[]=[];


        // for (let i = 0; i < gameSettings.currentGamedata.bonus.payOut; i++) {
        //    this.result.push(gameSettings.currentGamedata.bonus.payOut[i]);
            
        // }
        this.result=slotGameSettings.currentGamedata.bonus.payOut;
        // this.shuffle(this.result);
        console.log("bonus result",this.result);

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

    generateSlotData(reps:number =0){
        let res: string[]=[];


        let slot_array: number[]=[];
        let multiplier_array: number[]=[];
        // for (let index = 0; index < 3; index++) {
        //     slot_array.push(Math.floor(Math.random()*12));
            
        // }

        slot_array.push(1);
        slot_array.push(2);
        slot_array.push(1);

    //    let reelNum: number=Math.floor(Math.random()*12);
       let reelNum: number=1;


       
        if(!slot_array.includes(reelNum)){
            reelNum=-1;
        }

       slot_array.forEach((element)=>{
        if(element===reelNum)
            multiplier_array.push(slotGameSettings.currentGamedata.bonus.payTable[element]);
        else 
            multiplier_array.push(0);
       })
      
        this.result=[...slot_array,reelNum,...multiplier_array];

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

    setRandomStopIndex(){
        let amount: number=0;

        
        if(slotGameSettings.bonus.start && slotGameSettings.currentGamedata.bonus.type==bonusGameType.spin){
            
            slotGameSettings.bonus.stopIndex=this.getRandomPayoutIndex(slotGameSettings.currentGamedata.bonus.payOutProb);
            amount=slotGameSettings.BetPerLines*this.result[slotGameSettings.bonus.stopIndex];
            console.log("bonus amount", amount)
            console.log("bonus index", slotGameSettings.bonus.stopIndex)
            console.log("bonus result", this.result[slotGameSettings.bonus.stopIndex])
        }
        else if(slotGameSettings.bonus.start && slotGameSettings.currentGamedata.bonus.type==bonusGameType.tap){
            // gameSettings.bonus.stopIndex=-1;   
            this.shuffle(this.result);
            this.result.forEach((element)=>{
                if(element<=0)
                    return;
                amount+=slotGameSettings.BetPerLines*element;

                
            }) 
        }else if(slotGameSettings.bonus.start && slotGameSettings.currentGamedata.bonus.type=="slot"){
            // gameSettings.bonus.stopIndex=-1;
            for (let index = 1; index < 4; index++) {
                amount+=slotGameSettings.BetPerLines*this.result[this.result.length-index];
                
            }   
            // amount=gameSettings.currentBet*this.result[this.result.length-1];
            console.log("amount",amount);
            console.log("current bet",slotGameSettings.BetPerLines);
        }

        if(!amount || amount<0)
            amount=0
        // gameSettings.bonus.stopIndex = -1;
        return amount;

        
        // playerData.Balance += amount;
        // playerData.haveWon += amount;
        // playerData.currentWining=amount;
    }

    shuffle(array:number[]) {
        for (let i = array.length -1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i+1));
          let k = array[i];
          array[i] = array[j];
          array[j] = k;
        }

      }

     getRandomPayoutIndex(payOutProb) :number {
    
    const totalProb = payOutProb.reduce((sum, prob) => sum + prob, 0);

    // Normalize the probabilities to sum up to 1
    const normalizedProb = payOutProb.map(prob => prob / totalProb);


    const cumulativeProb = [];
    normalizedProb.reduce((acc, prob, index) => {
        cumulativeProb[index] = acc + prob;
        return cumulativeProb[index];
    }, 0);

    console.log("cuulative array",cumulativeProb);

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


export class GambleGame {
  type: String;
  clientId: string;
  currentWining: number;
  totalWining: number;
  multiplier: number;
  gambleCount: number;
  maxgambleCount: number;

  constructor(clientId: string, multiplier: number = 2) {
    this.clientId = clientId;
    this.multiplier = multiplier;
    this.gambleCount = 0;
    this.totalWining = 0;
    this.maxgambleCount = 5;
  }

  generateData(gambleAmount: number) {
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

  makeResultJson(clientId: string) {
    // const totalWinningAmount = (Math.round(amount * 100) / 100)
    console.log("triggered in make resultjson");

    const ResultData = {
      GambleData: {
        currentWining: this.currentWining,
        totalWinningAmount: this.totalWining,
      },
      PlayerData: PlayerData,
    };

    //TODO : ADD MESSAGE FOR CLIENT
    GData.playerSocket.sendMessage("GambleResult", ResultData);
    // sendMessageToClient(clientId, "GambleResult", ResultData);
  }

  updateplayerBalance() {
    GData.playerSocket.updatePlayerBalance(this.totalWining);
    this.makeResultJson(this.clientId);
  }

  reset() {
    this.gambleCount = 0;
    this.totalWining = 0;
    this.currentWining = 0;
    slotGameSettings.gamble.game = null;
    slotGameSettings.gamble.start = false;
  }

  checkIfClientExist(clients: Map<string, WebSocket>) {
    if (clients.has(this.clientId)) return true;
    else return false;
  }
}