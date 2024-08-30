import { currentGamedata } from "../../../Player";
import { betMultiplier, convertSymbols, shuffleArray, UiInitData } from "../../Utils/gameUtils";
import { WinData } from "../BaseSlotGame/WinData";
import { RandomResultGenerator } from "../RandomResultGenerator";


export class SLCM {
    public settings: any ;
    playerData = {
      haveWon: 0,
      currentWining: 0,
      totalbet: 0,
      rtpSpinCount: 0,
      totalSpin: 0,
    };

    constructor(public currentGameData : currentGamedata)
    {
        this.settings = {
            id : currentGameData.gameSettings.id,
            isSpecial : currentGameData.gameSettings.isSpecial,
            matrix : currentGameData.gameSettings.matrix,
            bets : currentGameData.gameSettings.bets,
            Symbols : currentGameData.gameSettings.Symbols,
            resultSymbolMatrix : []
        }
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
      this.settings.tempReels = [[]];
      this.playerData.totalbet += this.settings.currentBet;
      new RandomResultGenerator(this);
      console.log(this.settings.resultSymbolMatrix)
      
      
    //   const result = new CheckResult(this);
    } catch (error) {
      console.error("Failed to generate spin results:", error);
      this.sendError("Spin error");
    }
  }
    private initialize(GameData: any) {
        this.settings.Symbols = [];
        this.settings.Weights = [];
        this.settings._winData = new WinData(this);
        this.settings.currentGamedata = GameData;
        this.initSymbols();
        UiInitData.paylines = convertSymbols(this.settings.currentGamedata.Symbols);
        this.settings.startGame = true;
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
    let matrix: string[][] = [];

    for (let i = 0; i < this.settings.currentGamedata.matrix.x; i++) {
      let reel: string[] = [];

      this.settings.currentGamedata.Symbols.forEach((element) => {
        for (let j = 0; j < element.reelInstance[i]; j++) {
          reel.push(element.Id.toString());
        }
      });

      shuffleArray(reel);
      matrix.push(reel);
    }

    return matrix;
  }
    private initSymbols() {
        for (let i = 0; i < this.settings.currentGamedata.Symbols.length; i++) {
          this.settings.Symbols.push(
            this.settings.currentGamedata.Symbols[i].Id?.toString(),
          );
          this.settings.Weights.push(
            this.settings.currentGamedata.Symbols[i]?.weightedRandomness
          );
        }
      }
}

interface CMGameSettings {

}