import { currentGamedata } from "../../../Player";
import { RandomResultGenerator } from "../RandomResultGenerator";
import { WOFSETTINGS, WINNINGTYPE } from "./types";
import { initializeGameSettings, generateInitialReel, sendInitData,checkWinningCondition, calculatePayout, makeResultJson } from "./helper";

export class SLWOF {
  public settings: WOFSETTINGS;
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

  private async checkResult() {
    try {
        const resultmatrix = this.settings.resultSymbolMatrix;
        console.log("Result Matrix:", resultmatrix);

        const rows = resultmatrix.slice(1, 4); 
        const winningRows: number[] = [];
        let totalPayout = 0;

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            console.log(`Checking Row ${index + 2}:`, row);

            if (row.includes(0)) {
                console.log(`No win: '0' present in row ${index + 2}.`);
                continue; 
            }
            const isWinning = await checkWinningCondition(this, row);
            let payout = 0;

            switch (isWinning.winType) {
                case WINNINGTYPE.REGULAR:
                    console.log("Regular Win! Calculating payout...");
                    payout = await calculatePayout(this, row, isWinning.symbolId, WINNINGTYPE.REGULAR);
                    console.log(`Row ${index + 2} Regular Payout:`, payout);
                    break;

                case WINNINGTYPE.MIXED:
                    console.log("Mixed Win! Calculating mixed payout...");
                    payout = await calculatePayout(this, row, isWinning.symbolId, WINNINGTYPE.MIXED);
                    console.log(`Row ${index + 2} Mixed Payout:`, payout);
                    break;

                default:
                    console.log("No specific win condition met. Applying default payout.");
                    payout = this.settings.defaultPayout * this.settings.BetPerLines;
                    console.log(`Row ${index + 2} Default Payout:`, payout);
                    break;
            }
            const specialSymbolCount = row.filter(symbolId => {
                const symbol = this.settings.Symbols.find(sym => sym.Id === symbolId);
                return symbol && symbol.isSpecialWof;
            }).length;

            if (specialSymbolCount === 1) {
                payout *= 3;
            } else if (specialSymbolCount === 2) {
                payout *= 9;
            } else if (specialSymbolCount === 3) {
                payout *= 27;
            }
            if (payout > 0) {
              winningRows.push(index + 1);
            }
            console.log(`Row ${index + 2} Adjusted Payout with isSpecialWof count (${specialSymbolCount}):`, payout);
            totalPayout += payout;
        }
        const bonusSymbolsInRows = rows.flat().filter(symbolId => symbolId === 12).length;
        console.log(bonusSymbolsInRows)
        if (bonusSymbolsInRows >= 2) {
          console.log(`Bonus Game Triggered! Bonus symbol count: ${bonusSymbolsInRows}`);
         
          // triggerBonusGame();
        }
        this.playerData.currentWining = totalPayout;
        console.log("Total Payout for all rows:", totalPayout);
        makeResultJson(this, winningRows);

    } catch (error) {
        console.error("Error in checkResult:", error);
    }
}

  
}
