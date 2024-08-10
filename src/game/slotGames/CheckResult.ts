import SlotGame from "./slotGame";
import { RandomResultGenerator } from "./RandomResultGenerator";
import { ScatterPayEntry, BonusPayEntry, ResultType } from "./gameUtils";
import PayLines from "./PayLines";
import { WinData } from "./WinData";
import { bonusGameType, specialIcons } from "./gameUtils";
import { log } from "console";
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
    currentGame: SlotGame;

    constructor(current) {
        current.settings._winData = new WinData(current);
        this.currentGame = current;
        this.scatter = specialIcons.scatter;
        this.useScatter = current.settings.useScatter && this.scatter !== null;
        this.jackpot = current.settings.jackpot;
        this.useJackpot = this.jackpot !== null;
        this.scatterPayTable = current.settings.scatterPayTable;
        this.bonusPaytable = current.settings.bonusPayTable;
        this.reels = current.settings.resultSymbolMatrix;

        // console.log("SCATTER PAYTABLE : ", this.scatterPayTable);
        // console.log("Bonus PAYTABLE : ", this.bonusPaytable);

        this.scatterWinSymbols = [];
        this.jackpotWinSymbols = [];
        this.winSeq = null;

        this.bonusResult = [];

        this.searchWinSymbols();

        // if (this.currentGame.settings._winData.winningSymbols.length !== 0) {
        //     if (!this.currentGame.settings.freeSpinStarted)
        //         this.currentGame.settings.currentMoolahCount++
        //     this.currentGame.checkforMoolah();
        //     console.log("MOOLAH COUNT : ", this.currentGame.settings.currentMoolahCount);
        //     return;
        // }
        // else {
        //     if (this.currentGame.settings.currentMoolahCount >= 3 && (moolahPayOut.length + 3) > this.currentGame.settings.currentMoolahCount) {
        //         this.currentGame.settings._winData.freeSpins += moolahPayOut[3 - this.currentGame.settings.currentMoolahCount]
        //         if (!this.currentGame.settings.freeSpinStarted && this.currentGame.settings._winData.freeSpins != 0)
        //             this.startFreeSpin();
        //     }
        //     this.currentGame.settings.currentMoolahCount = 0;
        // }

    }

    searchWinSymbols() {
        // console.log("search win symbols");

        this.checkForWin();

        this.checkForFreeSpin();
        this.checkForBonus();
        this.checkForJackpot();
        this.checkForScatter();

        this.currentGame.settings._winData.winningLines =
            this.currentGame.settings._winData.winningLines.filter(
                (value, index, array) => array.indexOf(value) === index
            );
        console.log("winning symbols", this.currentGame.settings._winData.winningSymbols);

        this.currentGame.settings._winData.updateBalance();
        console.log("result :", this.currentGame.settings.resultSymbolMatrix);
        // console.log("win data", this.currentGame.settings._winData);
        console.log("Bonus start", this.currentGame.settings.bonus.start);

        if (!this.currentGame.settings.freeSpinStarted && this.currentGame.settings.freeSpinCount != 0)
            this.startFreeSpin();
        console.log("TOTAL WINING : " + this.currentGame.settings._winData.totalWinningAmount);
        console.log("PT BETS :" + this.currentGame.settings.currentBet);
        const winRate: number =
            (this.currentGame.player.haveWon / this.currentGame.player.totalbet) * 100;
        console.log("Total Bet : ", this.currentGame.player.totalbet);

        console.log(
            `Total Spend : ${this.currentGame.player.totalbet}  Total Won : ${this.currentGame.player.haveWon
            } 
        Current RTP : ${winRate.toFixed(2)}% `
        );

        console.log("_____________RESULT_END________________");
    }
    private checkForBonus() {
        if (!this.currentGame.settings.currentGamedata.bonus.isEnabled) return;
        if (this.currentGame.settings.freeSpinStarted) return
        let bonusSymbols = [];
        let temp = this.findSymbol(specialIcons.bonus);
        console.log("Bonus  : ", temp);

        if (temp.length > 0) bonusSymbols.push(...temp);
        this.bonusPaytable.forEach((element) => {
            if (
                element.symbolCount > 0 &&
                bonusSymbols.length >= element.symbolCount
            ) {
                this.currentGame.settings._winData.winningSymbols.push(bonusSymbols);
                this.currentGame.settings.bonus.start = true;
                this.currentGame.settings.noOfBonus++;
                if (this.currentGame.settings.currentGamedata.bonus.type == bonusGameType.tap)
                    this.bonusResult = this.currentGame.settings.bonus.game.generateData();

                this.currentGame.settings._winData.totalWinningAmount += this.currentGame.settings.bonus.game.setRandomStopIndex();
            } else {
                if (this.currentGame.settings.currentGamedata.bonus.type == bonusGameType.spin)
                    this.currentGame.settings.bonus.stopIndex = -1
            }


        });
    }

    checkForFreeSpin() {
        let freeSpin = [];
        let temp = this.findSymbol(specialIcons.FreeSpin);
        console.log("FreeSpin  : ", temp);
    }
    checkForWin() {
        const winningLines = [];
        this.currentGame.settings.lineData.forEach((line, index) => {
            const firstSymbolPosition = line[0];
            let firstSymbol = this.currentGame.settings.resultSymbolMatrix[firstSymbolPosition][0];
            if (firstSymbol === this.currentGame.settings.wildSymbol.SymbolID.toString()) {
                firstSymbol = this.findFirstNonWildSymbol(line);
            }

            const { isWinningLine, matchCount } = this.checkLineSymbols(firstSymbol, line);
            if (isWinningLine && matchCount >= 3) {
                const symbolMultiplier = this.accessData(firstSymbol, matchCount);
                console.log(`Line ${index} matched with symbol: ${firstSymbol}, Payout: ${symbolMultiplier}, Match Count: ${matchCount}`);
                winningLines.push({ line, symbol: firstSymbol, multiplier: symbolMultiplier, matchCount });
            }
        });
        return winningLines;
    }


    findFirstNonWildSymbol(line) {
        const wildSymbol = this.currentGame.settings.wildSymbol.SymbolID.toString();
        for (let i = 0; i < line.length; i++) {
            const rowIndex = line[i];
            const symbol = this.currentGame.settings.resultSymbolMatrix[rowIndex][i];
            if (symbol !== wildSymbol) {
                console.log(symbol, 'firstnonwild')
                return symbol;
            }
        }
        return wildSymbol;
    }


    checkLineSymbols(firstSymbol, line) {
        const wildSymbol = this.currentGame.settings.wildSymbol.SymbolID.toString();
        let matchCount = 1;
        let currentSymbol = firstSymbol;
        for (let i = 1; i < line.length; i++) {
            const rowIndex = line[i];
            const symbol = this.currentGame.settings.resultSymbolMatrix[rowIndex][i];
            if (symbol === undefined) {
                console.error(`Symbol at position [${rowIndex}, ${i}] is undefined.`);
                return { isWinningLine: false, matchCount: 0 };
            }
            if (symbol === currentSymbol || symbol === wildSymbol) {
                matchCount++;
            } else if (currentSymbol === wildSymbol) {
                currentSymbol = symbol;
                matchCount++;
            } else {
                break;
            }
        }
        return { isWinningLine: matchCount >= 3, matchCount };
    }

    accessData(symbol, matchCount) {
        console.log(symbol, 'symbol')
        const symbolData = this.currentGame.settings.currentGamedata.Symbols.find(s => s.Id.toString() === symbol.toString());
        if (symbolData) {
            const multiplierArray = symbolData.multiplier;
            if (multiplierArray && multiplierArray[5-matchCount]) {
                console.log(multiplierArray)
                return multiplierArray[5-matchCount][0];
            }
        }
        console.warn("Symbol not found or no multiplier data available for symbol", symbol);
        return 0;
    }





    private checkForScatter() {
        this.scatterWinSymbols = [];
        // this.scatterWin = null;

        if (this.useScatter) {
            // console.log("scattersds", this.scatter);
            let temp = this.findSymbol(specialIcons.scatter);
            console.log("useScatter", temp.length);

            if (temp.length > 0) this.scatterWinSymbols.push(...temp);

            this.scatterPayTable.forEach((sPL) => {
                if (
                    sPL.symbolCount > 0 &&
                    sPL.symbolCount == this.scatterWinSymbols.length
                ) {
                    this.currentGame.settings._winData.winningSymbols.push(this.scatterWinSymbols);
                    this.currentGame.settings._winData.freeSpins += sPL.freeSpins;
                    this.currentGame.settings._winData.totalWinningAmount += sPL.pay;
                }
            });

            // if (this.scatterWin == null) this.scatterWinSymbols = [];
        }
    }

    private checkForJackpot() {
        // this.jackpotWinSymbols = [];
        // this.jackpotWin = [];

        if (this.useJackpot) {

            var temp = this.findSymbol(specialIcons.jackpot);
            if (temp.length > 0) this.jackpotWinSymbols.push(...temp);

            // console.log('find Jackpot symbols: ' + this.jackpotWinSymbols);

            if (
                this.jackpot.symbolsCount > 0 &&
                this.jackpot.symbolsCount == this.jackpotWinSymbols.length
            ) {
                console.log("!!!!!JACKPOT!!!!!", temp);
                this.currentGame.settings._winData.winningSymbols.push(this.jackpotWinSymbols);
                this.currentGame.settings._winData.totalWinningAmount += this.jackpot.defaultAmount;
                this.currentGame.settings._winData.jackpotwin += this.jackpot.defaultAmount;
                //TODO :ADD JACKPOT WIN PAYMENT FOR THE FINAL JSON (done)
            }
        }
    }







    private findSymbol(SymbolName: string) {
        let symbolId: number = -1;
        let foundArray = [];

        this.currentGame.settings.currentGamedata.Symbols.forEach((element) => {


            if (SymbolName == element.Name) symbolId = element.Id;
        });

        for (let i = 0; i < this.currentGame.settings.resultSymbolMatrix.length; i++) {
            for (let j = 0; j < this.currentGame.settings.resultSymbolMatrix[i].length; j++) {
                if (this.currentGame.settings.resultSymbolMatrix[i][j] == symbolId.toString())
                    foundArray.push(j.toString() + "," + i.toString());
            }
        }
        return foundArray;
    }

    makeResultJson(isResult: ResultType, iconsToFill: number[][] = []) {
        //TODO : Try to send the jackpot win data without initializie a variable;
        this.currentGame.settings._winData.totalWinningAmount =
            Math.round(this.currentGame.settings._winData.totalWinningAmount * 100) / 100;
        const ResultData = {
            GameData: {
                ResultReel: this.currentGame.settings.resultSymbolMatrix,
                linesToEmit: this.currentGame.settings._winData.winningLines,
                symbolsToEmit: this.removeRecurringIndexSymbols(
                    this.currentGame.settings._winData.winningSymbols
                ),
                WinAmout: this.currentGame.settings._winData.totalWinningAmount,
                freeSpins: this.currentGame.settings.freeSpinCount,
                jackpot: this.currentGame.settings._winData.jackpotwin,
                isBonus: this.currentGame.settings.bonus.start,
                BonusStopIndex: this.currentGame.settings.bonus.stopIndex,
                BonusResult: this.bonusResult,
            },
            PlayerData: {
                Balance: this.currentGame.player.credits,
                haveWon: this.currentGame.player.haveWon,
                currentWining: this.currentGame.player.currentWining
            }
        };
        // this.currentGame.updateDatabase()
        if (isResult == ResultType.normal)
            this.currentGame.sendMessage("ResultData", ResultData);
        if (isResult == ResultType.moolah) {
            ResultData.GameData['iconstoFill'] = iconsToFill;
            this.currentGame.sendMessage("MoolahResultData", ResultData);

        }
    }

    private removeRecurringIndexSymbols(symbolsToEmit: string[][]): string[][] {
        const seen = new Set<string>();
        const result: string[][] = [];

        symbolsToEmit.forEach((subArray) => {
            if (!Array.isArray(subArray)) {
                console.warn('Expected an array but got', subArray);
                return;
            }
            const uniqueSubArray: string[] = [];
            subArray.forEach((symbol) => {
                if (!seen.has(symbol)) {
                    seen.add(symbol);
                    uniqueSubArray.push(symbol);
                }
            });
            if (uniqueSubArray.length > 0) {
                result.push(uniqueSubArray);
            }
        });

        return result;
    }


    private startFreeSpin() {
        console.log(
            "____----Started FREE SPIN ----_____" + " :::  FREE SPINSS ::::",
            this.currentGame.settings._winData.freeSpins
        );

        this.currentGame.sendMessage('StartedFreeSpin', {})
        this.currentGame.settings.freeSpinStarted = true;
        for (let i = 0; i <= this.currentGame.settings._winData.freeSpins; i++) {
            this.currentGame.settings.bonus.start = false;
            new RandomResultGenerator(this.currentGame);
            new CheckResult(this.currentGame);
            console.log(
                "FREE SPINS LEFTTT ::::" + (this.currentGame.settings._winData.freeSpins - i)
            );
        }
        this.currentGame.settings._winData.freeSpins = 0;
        this.currentGame.sendMessage("StoppedFreeSpins", {});
        // this.currentGame.settings.freeSpinStarted = false;
        console.log("____----Stopped FREE SPIN ----_____");
    }


}