import { log } from "console";
import { currentGamedata } from "../../../Player";
import { gameData } from "../../testData";
import { betMultiplier, convertSymbols, shuffleArray, UiInitData } from "../../Utils/gameUtils";
import { GameData } from "../BaseSlotGame/gameType";
import { WinData } from "../BaseSlotGame/WinData";
import { RandomResultGenerator } from "../RandomResultGenerator";
import { int } from "aws-sdk/clients/datapipeline";


export class SLCM {
    public settings: CMSettings ;
    playerData = {
      haveWon: 0,
      currentWining: 0,
      totalbet: 0,
      rtpSpinCount: 0,
      totalSpin: 0,
      currentPayout : 0
    };

    constructor(public currentGameData : currentGamedata)
    {
      this.settings = {
        id: currentGameData.gameSettings.id,
        isSpecial: currentGameData.gameSettings.isSpecial,
        matrix: currentGameData.gameSettings.matrix,
        bets: currentGameData.gameSettings.bets,
        Symbols: this.initSymbols,
        resultSymbolMatrix: [],
        currentGamedata: currentGameData.gameSettings,
        _winData: new WinData(this),
        currentBet: 0, // Set initial value
        currentLines: 0, // Set initial value
        BetPerLines: 0, // Set initial value
        reels: [], // Initialize reels array
        lastRedSpin : [],
        lastReSpin :[],

    };
        this.initialize(currentGameData.gameSettings);
    }
    
  sendMessage(action: string, message: any) {
    this.currentGameData.sendMessage(action, message);
  }
  sendError(message: string) {
    this.currentGameData.sendError(message);
  }
  sendAlert(message: string) {
    this.currentGameData.sendAlert(message);
  }
  updatePlayerBalance(message: number) {
    this.currentGameData.updatePlayerBalance(message);
  }
  deductPlayerBalance(message: number) {
    this.currentGameData.deductPlayerBalance(message);
  }
  getPlayerData() {
    return this.currentGameData.getPlayerData();
  }

  messageHandler(response: any) {
    switch (response.id) {
        case "SPIN":
            this.settings.matrix.x = 3;
                this.settings.currentLines = response.data.currentLines;
                this.settings.BetPerLines = betMultiplier[response.data.currentBet];
                this.settings.currentBet =
                  betMultiplier[response.data.currentBet] *
                  this.settings.currentLines;
                this.spinResult();
        break;

    }
  }
  private async spinResult() {
    try {
      const playerData = this.getPlayerData();
      if (this.settings.currentBet > playerData.credits) {
        console.log("Low Balance : ", playerData.credits);
        console.log("Current Bet : ", this.settings.currentBet);
        this.sendError("Low Balance");
        return;
      }
        await this.deductPlayerBalance(this.settings.currentBet);
        
        this.settings.lastReSpin = [];
        this.settings.lastRedSpin = [];
        this.playerData.totalbet += this.settings.currentBet;
      new RandomResultGenerator(this);
      this.checkResult();
    } catch (error) {
      console.error("Failed to generate spin results:", error);
      this.sendError("Spin error");
    }
  }

    private checkResult()
    {
      this.settings.resultSymbolMatrix = this.settings.resultSymbolMatrix[0];
      this.settings.resultSymbolMatrix.forEach((element,index) => {
        const symbol = this.settings.Symbols.filter(symbol => symbol.Id === element);
        if(symbol[0].Id != 0)
        this.settings.resultSymbolMatrix[index] = symbol[0];
        else
        this.settings.resultSymbolMatrix[index] = "Blank";
      });
      // console.log( this.settings.resultSymbolMatrix);
      
      console.log("After", this.settings.resultSymbolMatrix);
      const totalPayout =  this.settings.resultSymbolMatrix
      .filter(symbol => symbol !== "Blank")  // Filter out any -1 values
      .map(symbol => symbol.payout)     // Map to the payout values
      .join('') || "0";   
        this.playerData.currentPayout = parseInt(totalPayout);
      console.log(`Total payout: ${totalPayout}`);
      if( this.settings.resultSymbolMatrix.length != 0)
      {
          if(this.playerData.currentPayout == 0)
          this.checkForReSpin();
          
          if(this.playerData.currentPayout > 0 && this.playerData.currentPayout <=5)
          this.checkForRedSpin();
    }
  }
  private checkForReSpin() {
    this.settings.resultSymbolMatrix = this.settings.resultSymbolMatrix.flat();
  
    this.settings.resultSymbolMatrix.forEach((Element, Index) => {
      if (Element !== "Blank" && Element.canCallRespin) {
        this.settings.lastReSpin.push({ Symbol: Element, Index: Index });
        new RandomResultGenerator(this);
  
        console.log("Called ReSpin", this.settings.resultSymbolMatrix[Index]);
  
        this.settings.lastReSpin.forEach(element => {
          this.settings.resultSymbolMatrix[element.Index] = element.Symbol;
        });
  
        console.log("For ReSpin:", this.settings.resultSymbolMatrix);
  
        this.checkResult();
        return;
      }
    });
  }
  

    private checkForRedSpin()
    {
      this.settings.resultSymbolMatrix = this.settings.resultSymbolMatrix.flat();
  
      this.settings.resultSymbolMatrix.forEach((Element, Index) => {
        if (Element !== "Blank" && Element.canCallRedpin) {
          this.settings.lastRedSpin.push({ Symbol: Element, Index: Index });
          new RandomResultGenerator(this);
    
          console.log("Called RedSpin", this.settings.resultSymbolMatrix[Index]);
    
          this.settings.lastRedSpin.forEach(element => {
            this.settings.resultSymbolMatrix[element.Index] = element.Symbol;
          });
    
          console.log("For RedSpin:", this.settings.resultSymbolMatrix);
    
          this.checkResult();
          return;
        }
      });
    }
    private initialize(gameData : any) {
      this.settings.currentGamedata = gameData;
        this.settings._winData = new WinData(this);
        UiInitData.paylines = convertSymbols(this.settings.currentGamedata.Symbols);
        this.sendInitdata();
      }
    
  public sendInitdata() {
    this.settings.reels = this.generateInitialreel();
    const dataToSend = {
      GameData: {
        Reel: this.settings.reels,
        Bets: this.settings.currentGamedata.bets,
        autoSpin: [1, 5, 10, 20],
      },
      UIData: UiInitData,
      PlayerData: {
        Balance: this.getPlayerData().credits,
        haveWon: this.playerData.haveWon,
        currentWining: this.playerData.currentWining,
        totalbet: this.playerData.totalbet,
      },
    };

    this.sendMessage("InitData", dataToSend);
  }

  private generateInitialreel(): string[][] {
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
    const Symbols  = []; // Explicitly declare Symbols as an array of Symbol objects
    this.currentGameData.gameSettings.Symbols.forEach((Element: Symbol) => {
      Symbols.push(Element);
    });
    return Symbols;
  }

  isRandomNumberGreaterThan(percentage: number): boolean {
    // Generate a random number, either 0 or 1
    const randomNumber = Math.floor(Math.random() * 2);
  
    // Compare the random number with the threshold and return the result
    return randomNumber > percentage/100;
  }
}




interface Symbol {
  Name: string;
  Id: number;
  payout: string;
  canCallRedSpin: boolean;
  canCallRespin: boolean;
  reelInstance: { [key: string]: number };
}

 interface CMSettings {
  id : string;
  isSpecial : boolean;
  matrix : {x : number, y: number};
  currentGamedata: GameData;
  resultSymbolMatrix: any[];
  _winData: WinData | undefined;
  currentBet: number;
  currentLines: number;
  BetPerLines: number;
  bets: number[];
  reels: any[][];
  Symbols : Symbol[];
  lastRedSpin : {Index : number, Symbol : number}[],
  lastReSpin : {Index : number, Symbol : number}[],


}