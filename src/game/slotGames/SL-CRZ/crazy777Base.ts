import { currentGamedata } from "../../../Player";
import { WinData } from "../BaseSlotGame/WinData";
import { RandomResultGenerator } from "../RandomResultGenerator";
import { CRZSETTINGS } from "./types";
import { initializeGameSettings, generateInitialReel, sendInitData } from "./helper";

export class SLCRZ {
  public settings: CRZSETTINGS;
  playerData = {
    haveWon: 0,
    currentWining: 0,
    totalbet: 0,
    rtpSpinCount: 0,
    totalSpin: 0,
    currentPayout: 0
  };

  constructor(public currentGameData: currentGamedata) {
    this.settings = initializeGameSettings(currentGameData, this);
    generateInitialReel(this.settings)
    sendInitData(this)
  }
  get initSymbols() {
    const Symbols = [];
    this.currentGameData.gameSettings.Symbols.forEach((Element: Symbol) => {
      Symbols.push(Element);
    });
    return Symbols;
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

  updatePlayerBalance(amount: number) {
    this.currentGameData.updatePlayerBalance(amount);
  }

  deductPlayerBalance(amount: number) {
    this.currentGameData.deductPlayerBalance(amount);
  }

  getPlayerData() {
    return this.currentGameData.getPlayerData();
  }

  messageHandler(response: any) {
    switch (response.id) {
      case "SPIN":
        this.prepareSpin(response.data);
        this.spinResult();
        break;
    }
  }

  private prepareSpin(data: any) {
    this.settings.matrix.x;
    this.settings.matrix.y;
    this.settings.currentLines = data.currentLines;
    this.settings.BetPerLines = this.settings.currentGamedata.bets[data.currentBet];
    this.settings.currentBet = this.settings.BetPerLines * this.settings.currentLines;
  }

  private async spinResult() {
    try {
      const playerData = this.getPlayerData();
      if (this.settings.currentBet > playerData.credits) {
        this.sendError("Low Balance");
        return;
      }
      await this.deductPlayerBalance(this.settings.currentBet);
      this.playerData.totalbet += this.settings.currentBet;
      new RandomResultGenerator(this);
      this.checkResult();
    } catch (error) {
      this.sendError("Spin error");
      console.error("Failed to generate spin results:", error);
    }
  }

  private checkResult() {
    const resultmatrix = this.settings.resultSymbolMatrix;
    const checkMatrix = resultmatrix.map(row => row.slice(0, 3));
    const specialMatrix = resultmatrix.map(row => row[3]);
    this.printMatrix (resultmatrix)
    // this.printMatrix(checkMatrix)
    // this.printMatrix(specialMatrix, true)

    const middleRow = checkMatrix[1];
    const extrasymbol= specialMatrix[1];
    console.log("Middle row:", middleRow);
    console.log("special element:", extrasymbol);


    const isWinning = !middleRow.includes(0); // If '0' exists, no win

    if (isWinning) {
        console.log("Winning condition met! Calculating payout...");
        const payout = this.calculatePayout(middleRow);
        console.log("Payout:", payout);
    } else {
        console.log("No winning condition due to a 'Blank' symbol.");
    }
  }
  private calculatePayout(symbols: any[]): number {
    let payout = 0;

    symbols.forEach(symbol => {
        if (symbol === '0') {
            return; 
        }

        switch (symbol) {
            case '1': // Example symbol '1'
                payout += 10;  // Example payout value
                break;
            case '2': // Example symbol '2'
                payout += 20;  // Example payout value
                break;
            // Add more cases for different symbols
            default:
                payout += 5; // Default payout for other symbols
        }
    });

    return payout;
  }
  

  private printMatrix(matrix: any[][] | any[], isSingleColumn: boolean = false) {
    if (isSingleColumn) {
        // If it's a single column matrix (like specialMatrix)
        matrix.forEach((item: any) => {
            console.log(`[ '${item}' ]`);
        });
    } else {
        // For regular matrices like resultSymbolMatrix or checkMatrix
        matrix.forEach((row: any[]) => {
            console.log(`[ '${row.join("', '")}' ]`);
        });
    }
}
}
