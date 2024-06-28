// import { Alerts } from "./Alerts";
// import { sendMessageToClient } from "./App";
import { gameSettings, gameWining, getCurrentRTP, playerData, startFreeSpin } from "./global";
import { RandomResultGenerator } from "./slotDataInit";
import {
  ScatterPayEntry,
  BonusPayEntry,
  specialIcons,
  bonusGameType,
  removeRecurringIndexSymbols,
} from "./gameUtils";
import { bonusGame } from "./bonusResults";
import { getClient } from "../user/user";
import { middleware } from "../utils/middleware";
import { startInfiniteSpins } from "./reel";
import { verifyToken } from "../middleware/tokenAuth";
import { gameData } from "./testData";
export class CheckResult {
  scatter: string;
  useScatter: boolean;
  jackpot: any;
  useJackpot: boolean;
  payTable: PayLines[];
  scatterPayTable: ScatterPayEntry[];
  bonusPaytable: BonusPayEntry[];
  reels: string[][];
  // scatterWin: any;
  // jackpotWin: any;
  scatterWinSymbols: any[];
  jackpotWinSymbols: any[];
  winSeq: any;

  bonusResult: string[];

  constructor() {
    gameSettings._winData = new WinData(playerData.playerId);
    this.scatter = specialIcons.scatter;
    this.useScatter = gameSettings.useScatter && this.scatter !== null;
    this.jackpot = gameSettings.jackpot;
    this.useJackpot = this.jackpot !== null;
    this.scatterPayTable = gameSettings.scatterPayTable;
    this.bonusPaytable = gameSettings.bonusPayTable;
    this.reels = gameSettings.resultSymbolMatrix;
    console.log("SCATTER PAYTABLE : ", this.scatterPayTable);
    console.log("Bonus PAYTABLE : ", this.bonusPaytable);

    // this.scatterWin = [];
    // this.jackpotWin = [];

    // gameWining.WinningLines = [];
    // gameWining.winningSymbols = [];
    // gameWining.TotalWinningAmount = 0;

    this.scatterWinSymbols = [];
    this.jackpotWinSymbols = [];
    this.winSeq = null;

    this.bonusResult = [];

    this.searchWinSymbols();
  }

  searchWinSymbols() {
    console.log("search win symbols");
    // gameWining.freeSpins = 0;
    // gameWining.winningSymbols = [];
    // gameWining.WinningLines = [];
    // gameWining.TotalWinningAmount = 0;

    this.checkForWin();
    // this.checkForScatter();
    // this.checkForBonus();
    this.checkForJackpot();

    // let excludeindex: number[] = [];
    // for (let i = 0; i < gameSettings._winData.winningSymbols.length; i++) {
    //     for (let j = i + 1; j < gameSettings._winData.winningSymbols.length; j++) {
    //         if (gameSettings._winData.winningSymbols[i].some(ai => gameSettings._winData.winningSymbols[j].includes(ai)))
    //             excludeindex.push(j);

    //     }

    // }

    // let excludeindexModified: number[] = excludeindex.filter((value, index, array) => array.indexOf(value) === index);
    // for (let i = excludeindexModified.length - 1; i >= 0; i--) {

    //     gameSettings._winData.winningSymbols.splice(excludeindexModified[i], 1);
    // }

    gameSettings._winData.winningLines =
      gameSettings._winData.winningLines.filter(
        (value, index, array) => array.indexOf(value) === index
      );
      console.log("winning symbols", gameSettings._winData.winningSymbols);
      
    gameSettings._winData.updateBalance();
    console.log("result :", gameSettings.resultSymbolMatrix);
    console.log("win data", gameSettings._winData);
    console.log("Bonus start", gameSettings.bonus.start);

    if(!gameSettings.freeSpinStarted && gameSettings._winData.freeSpins != 0)
        startFreeSpin();

    // Math.round(num * 100) / 100).toFixed(2)
    console.log("TOTAL WINING : " + gameSettings._winData.totalWinningAmount);
    // console.log(gameWining.WinningLines);
    // console.log(gameWining.winningSymbols);
    console.log("PT BETS :" + getCurrentRTP.playerTotalBets);
    
    const winRate: number =
      (getCurrentRTP.playerWon / getCurrentRTP.playerTotalBets) * 100;
    console.log(
      `Total Spend : ${getCurrentRTP.playerTotalBets}  Total Won : ${
        getCurrentRTP.playerWon
      } 
      Current RTP : ${winRate.toFixed(2)}% `
    );
 
    console.log("_____________RESULT_END________________");
  }

  checkForBonus() {
    if (!gameSettings.currentGamedata.bonus.isEnabled) return;

    let bonusSymbols = [];
    let temp = this.findSymbol(specialIcons.bonus);
    if (temp.length > 0) bonusSymbols.push(...temp);
    // console.log("paytable length",this.bonusPaytable.length);
    this.bonusPaytable.forEach((element) => {
      if (
        element.symbolCount > 0 &&
        element.symbolCount == bonusSymbols.length
      ) {
        // bonuswin = new WinData(bonusSymbols, 0, 0);
        gameSettings._winData.winningSymbols.push(bonusSymbols);
        // gameSettings._winData.bonus=true;
        gameSettings.bonus.start = true;

        if (gameSettings.currentGamedata.bonus.type == bonusGameType.tap)
          this.bonusResult = gameSettings.bonus.game.generateData(
            gameSettings.bonusPayTable[0]?.pay
          );

        gameSettings.bonus.game.setRandomStopIndex();
      }
    });
  }

  checkForWin() {
    let allComboWin = [];
    gameSettings.lineData.forEach((lb, index) => {
      let win = null;

      gameSettings.fullPayTable.forEach((Payline: PayLines) => {
        //  find max win (or win with max symbols count)
        const winTemp = this.getPayLineWin(Payline, lb, allComboWin);

        if (winTemp != null) {
          if (win == null) win = winTemp;
          else {
            if (win.Pay < winTemp.pay || win.FreeSpins < winTemp.freeSpins)
              win = winTemp;
          }
          // gameWining.WinningLines.push(index);
          gameSettings._winData.winningLines.push(index);

          console.log(`Line Index : ${index} : ` + lb + " - line win: " + win);
        }
      });
    });

    const filteredArray = this.checkforDuplicate(allComboWin);
    let BonusArray=[];
    filteredArray.forEach((element) => {
      gameSettings._winData.winningSymbols.push(element.pos);
      if(gameSettings.bonus.id>=0 && element.symbol==gameSettings.bonus.id.toString())
        BonusArray.push(element)

      gameSettings._winData.totalWinningAmount +=
        element.pay * gameSettings.currentBet;
      gameSettings._winData.freeSpins += element.freeSpin;
    });
    

  
  //check for bonus
  if(BonusArray.length>0){
      if (!gameSettings.currentGamedata.bonus.isEnabled)
          return;
      gameSettings.bonus.start = true;

   if (gameSettings.currentGamedata.bonus.type == bonusGameType.tap)
      this.bonusResult = gameSettings.bonus.game.generateData(gameSettings.bonusPayTable[0]?.pay);
      else if(gameSettings.currentGamedata.bonus.type=="slot")
      this.bonusResult = gameSettings.bonus.game.generateSlotData();

      gameSettings._winData.totalWinningAmount+=gameSettings.bonus.game.setRandomStopIndex();
      console.log("stop index2",gameSettings.bonus.stopIndex);
  }

  }

  checkforDuplicate(allComboWin: any[]): any[] {
    allComboWin.sort((a, b) => b.pos.length - a.pos.length);

    const filteredArray = [];

    for (const currentItem of allComboWin) {
      const isSubsetOfAny = filteredArray.some(
        (item) =>
          item.symbol === currentItem.symbol &&
          this.isSubset(currentItem.pos, item.pos)
      );
      if (!isSubsetOfAny) {
        filteredArray.push(currentItem);
      }
    }

    return filteredArray;
  }

  isSubset(subset: string[], superset: string[]): boolean {
    const supersetSet = new Set(superset);
    return subset.every((elem) => supersetSet.has(elem));
  }

  checkForScatter() {
    this.scatterWinSymbols = [];
    // this.scatterWin = null;

    if (this.useScatter) {
      // console.log("scattersds", this.scatter);
      let temp = this.findSymbol(this.scatter);

      if (temp.length > 0) this.scatterWinSymbols.push(...temp);

      this.scatterPayTable.forEach((sPL) => {
        if (
          sPL.symbolCount > 0 &&
          sPL.symbolCount == this.scatterWinSymbols.length
        ) {
          gameSettings._winData.winningSymbols.push(this.scatterWinSymbols);
          gameSettings._winData.freeSpins += sPL.freeSpins;
          gameSettings._winData.totalWinningAmount += sPL.pay;
        }
      });

      // if (this.scatterWin == null) this.scatterWinSymbols = [];
    }
  }

  checkForJackpot() {
    // this.jackpotWinSymbols = [];
    // this.jackpotWin = [];

    if (this.useJackpot) {
      var temp = this.findSymbol(this.jackpot.symbolName);
      if (temp.length > 0) this.jackpotWinSymbols.push(...temp);

      // console.log('find Jackpot symbols: ' + this.jackpotWinSymbols);

      if (
        this.jackpot.symbolsCount > 0 &&
        this.jackpot.symbolsCount == this.jackpotWinSymbols.length
      ) {
        gameSettings._winData.winningSymbols.push(this.jackpotWinSymbols);
        gameSettings._winData.totalWinningAmount += this.jackpot.defaultAmount;
        gameSettings._winData.jackpotwin += this.jackpot.defaultAmount;
        //TODO :ADD JACKPOT WIN PAYMENT FOR THE FINAL JSON (done)
      }
    }
  }

  getPayLineWin(payLine: PayLines, lineData: any, allComboWin: any[]) {
    if (payLine == null) return null;

    let master = [];
    let winSymbols = [];

    for (let i = 0; i < lineData.length; i++) {
      let tempWinSymbols = {
        pos: [],
        symbol: "",
        pay: 0,
        freeSpin: 0,
      };
      const symbol = this.getSymbolOnMatrix(i);
      const s = symbol[lineData[i]];
      tempWinSymbols.symbol = s;

      if (payLine.line[i] !== specialIcons.any && s !== payLine.line[i]) {
        return;
      } else if (
        payLine.line[i] !== specialIcons.any &&
        s === payLine.line[i]
      ) {
        const symbolIndex = i.toString() + "," + lineData[i].toString();
        winSymbols.push(symbolIndex);
        // gameSettings._winData.winningSymbols.push(symbolIndex);

        tempWinSymbols.pos.push(symbolIndex);
        tempWinSymbols.pay = payLine.pay;
        tempWinSymbols.freeSpin = payLine.freeSpins;
      }
      master.push(tempWinSymbols);
    }
    // gameSettings._winData.winningSymbols.push(winSymbols);
    const filteredArray = master.filter((item) => item.pos.length > 0);

    const groupedBySymbol = filteredArray.reduce((acc, item) => {
      if (!acc[item.symbol]) {
        acc[item.symbol] = {
          symbol: item.symbol,
          pos: [],
          pay: item.pay,
          freeSpin: item.freeSpin,
        };
      }
      acc[item.symbol].pos = acc[item.symbol].pos.concat(item.pos);
      return acc;
    }, {});

    // Step 3: Convert the grouped object back into an array of objects
    const mergedArray = Object.values(groupedBySymbol);

    if (!payLine.pay) payLine.pay = 0;

    allComboWin.push(...mergedArray);
    // gameSettings._winData.freeSpins += payLine.freeSpins;
    // gameSettings._winData.totalWinningAmount += payLine.pay

    // const winData=new WinData(winSymbols, payLine.freeSpins, payLine.pay);

    return { freeSpins: payLine.freeSpins, pay: payLine.pay };
  }

  getSymbolOnMatrix(index: number) {
    let symbolsOnGrid = [];
    for (let i = 0; i < gameSettings.matrix.y; i++) {
      const symbol = gameSettings.resultSymbolMatrix[i][index];
      symbolsOnGrid.push(symbol);
    }
    return symbolsOnGrid;
  }

  getIndexForResult(index: number) {
    for (let i = 0; i < gameSettings.matrix.y; i++) {
      let symbolIndex = index.toString() + "," + i.toString();
      return symbolIndex;
    }
  }

  findSymbol(SymbolName: string) {
    let symbolId: number = -1;
    let foundArray = [];

    gameSettings.currentGamedata.Symbols.forEach((element) => {
      if (SymbolName == element.Name) symbolId = element.Id;
    });

    for (let i = 0; i < gameSettings.resultSymbolMatrix.length; i++) {
      for (let j = 0; j < gameSettings.resultSymbolMatrix[i].length; j++) {
        if (gameSettings.resultSymbolMatrix[i][j] == symbolId.toString())
          foundArray.push(j.toString() + "," + i.toString());
      }
    }
    return foundArray;
  }

  makeResultJson(isResult : ResultType, iconsToFill: number[][]=[]) {
    //TODO : Try to send the jackpot win data without initializie a variable;
    gameSettings._winData.totalWinningAmount =
      Math.round(gameSettings._winData.totalWinningAmount * 100) / 100;
    const ResultData = {
      GameData: {
        ResultReel: gameSettings.resultSymbolMatrix,
        linesToEmit: gameSettings._winData.winningLines,
        // linesToEmit: gameWining.WinningLines,
        symbolsToEmit: removeRecurringIndexSymbols(
          gameSettings._winData.winningSymbols
        ),
        // symbolsToEmit: gameWining.winningSymbols,
        WinAmout: gameSettings._winData.totalWinningAmount,
        // WinAmout: gameWining.TotalWinningAmount,
        freeSpins: gameSettings._winData.freeSpins,
        // freeSpins: gameWining.freeSpins,
        jackpot: gameSettings._winData.jackpotwin,
        isBonus: gameSettings.bonus.start,
        BonusStopIndex: gameSettings.bonus.stopIndex,
        BonusResult: this.bonusResult,
      },
      PlayerData: playerData,
    };
    if(isResult == ResultType.normal)
    getClient(playerData.playerId).sendMessage("ResultData", ResultData);
    if(isResult == ResultType.moolah){
      ResultData.GameData['iconstoFill']=iconsToFill;
      getClient(playerData.playerId).sendMessage("MoolahResultData", ResultData);
    }

    // sendMessageToClient(this.clientID, "ResultData", ResultData);
  }

  // return symbols from windows
  getWindowsSymbols(reel: number) {
    let vSymbols = [];
    for (let si = 0; si < gameSettings.matrix.y; si++) {
      const order = si;
      vSymbols.push(gameSettings.resultSymbolMatrix[reel]);
    }
    return vSymbols;
  }
}

// Helper class to make combinations
class ComboCounter {
  maxCounterValues: any;
  combo: any[];
  firstCombo: boolean;
  constructor(
    maxCounterValues // positions [max Val0, max Val1, max Val2, ...]
  ) {
    this.maxCounterValues = maxCounterValues;
    this.combo = [];
    this.maxCounterValues.forEach((p) => {
      this.combo.push(0);
    });
    this.firstCombo = true;
  }

  nextCombo() {
    if (this.firstCombo) {
      this.firstCombo = false;
      return true;
    }
    for (let i = this.maxCounterValues.length - 1; i >= 0; i--) {
      if (this.combo[i] < this.maxCounterValues[i]) {
        this.combo[i]++;
        if (i != this.maxCounterValues.length - 1) {
          // reset low "bits"
          for (var j = i + 1; j < this.maxCounterValues.length; j++) {
            this.combo[j] = 0;
          }
        }
        return true;
      }
    }
    return false;
  }

  sum() {
    let s = 0;
    this.combo.forEach((ci) => {
      s += ci;
    });
    return s;
  }

  getComboCounts() {
    let counts = 1;
    this.maxCounterValues.forEach((p) => {
      if (p != 0) counts *= p;
    });
  }
}

export class PayLines {
  wild: any;
  useWildInFirstPosition: boolean;
  useWild: any;
  symbolsDict: any;
  line: any;
  pay: any;
  freeSpins: any;

  constructor(line, pay, freeSpins, wild) {
    this.line = line;
    this.pay = pay;
    this.freeSpins = freeSpins;
    this.useWildInFirstPosition = false;
    this.wild = wild;
  }

  getWildLines() {
    let res: PayLines[] = [];
    if (!gameSettings.useWild) return res; // return empty list

    let wPoss = this.getPositionsForWild();

    const maxWildsCount = this.useWildInFirstPosition
      ? wPoss.length - 1
      : wPoss.length;
    let minWildsCount = 1;
    let maxCounterValues: any[] = [];
    wPoss.forEach((p) => {
      maxCounterValues.push(1);
    });

    let cC = new ComboCounter(maxCounterValues);
    while (cC.nextCombo()) {
      let combo = cC.combo;
      let comboSum = cC.sum(); // count of wilds in combo

      if (comboSum >= minWildsCount && comboSum <= maxWildsCount) {
        let p = new PayLines(
          Array.from(this.line),
          this.pay,
          this.freeSpins,
          this.wild
        );
        for (let i = 0; i < wPoss.length; i++) {
          let pos = wPoss[i];
          if (combo[i] == 1) {
            p.line[pos] = this.wild;
          }
        }
        if (!this.isEqual(p) && !this.containEqualLine(res, p)) res.push(p);
      }
    }
    return res;
  }

  getPositionsForWild() {
    let wPoss: any[] = [];
    let counter = 0;
    let symbolsDict: any[] = [];
    gameSettings.currentGamedata.Symbols.forEach((name) => {
      const data = {
        name: name.Name,
        Id: name.Id,
        useWildSub: name.useWildSub,
      };
      symbolsDict.push(data);
    });

    for (let i = 0; i < this.line.length; i++) {
      let sName = this.line[i];
      if (sName !== specialIcons.any && sName !== this.wild) {
        if (!this.useWildInFirstPosition && counter == 0) {
          // don't use first
          counter++;
        } else {
          if (symbolsDict[sName]?.useWildSub) wPoss.push(i);
          counter++;
        }
      }
    }
    return wPoss;
  }

  isEqual(pLine) {
    if (pLine === null) return false;
    if (pLine.line === null) return false;
    if (this.line.length != pLine.line.length) return false;
    for (let i = 0; i < this.line.length; i++) {
      if (this.line[i] !== pLine.line[i]) return false;
    }
    return true;
  }

  containEqualLine(pList, pLine) {
    if (pList == null) return false;
    if (pLine == null) return false;
    if (pLine.line == null) return false;
    for (let i = 0; i < pList.length; i++) {
      if (pList[i].isEqual(pLine)) return true;
    }
    return false;
  }
}

export class WinData {
  freeSpins: number;
  winningSymbols: any[];
  winningLines: any[];
  totalWinningAmount: number;
  jackpotwin: number;
  clientId: string;
  resultReelIndex: number[] = [];
  constructor(clientId: string) {
    this.freeSpins = 0;
    this.winningLines = [];
    this.winningSymbols = [];
    this.totalWinningAmount = 0;
    this.jackpotwin = 0;
    this.clientId = clientId;
  }

  updateBalance() {
    // gameWining.TotalWinningAmount += this.pay;
    playerData.Balance += this.totalWinningAmount;
    playerData.haveWon += this.totalWinningAmount;
    playerData.currentWining = this.totalWinningAmount;

    getCurrentRTP.playerWon += this.totalWinningAmount;
    console.log("BETS "+ gameSettings.currentBet);
    
    if(!gameSettings.freeSpinStarted )
    getCurrentRTP.playerTotalBets += gameSettings.currentBet;
    else
    getCurrentRTP.playerTotalBets += 0;
  
  }
}

export enum ResultType {
  moolah = "moolah",
  normal = "normal",
}
