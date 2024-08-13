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
    scatterWinSymbols: any[];
    jackpotWinSymbols: any[];
    winSeq: any;
    bonusResult: string[];
    currentGame: SlotGame;
    constructor(current) {
        current.settings._winData = new WinData(current);
        this.currentGame = current;
        this.scatter = specialIcons.scatter;
        this.jackpot = current.settings.jackpot;
        this.useJackpot = this.jackpot !== null;
        this.scatterPayTable = current.settings.scatterPayTable;
        this.bonusPaytable = current.settings.bonusPayTable;
        this.reels = current.settings.resultSymbolMatrix;
        this.scatterWinSymbols = [];
        this.jackpotWinSymbols = [];
        this.winSeq = null;
        this.bonusResult = [];
        this.searchWinSymbols();
    }
    searchWinSymbols() {
        this.checkForWin();
        this.checkForFreeSpin();
        this.checkForBonus();
        this.checkForJackpot();
        this.checkForScatter();

        this.currentGame.settings._winData.winningLines =
            this.currentGame.settings._winData.winningLines.filter(
                (value, index, array) => array.indexOf(value) === index
            );

        this.currentGame.settings._winData.updateBalance();

        if (!this.currentGame.settings.freeSpin.freeSpinStarted && this.currentGame.settings.freeSpin.freeSpinCount != 0)
            this.startFreeSpin();
        const winRate: number =
            (this.currentGame.player.haveWon / this.currentGame.player.totalbet) * 100;
        console.log(
            `Total Spend : ${this.currentGame.player.totalbet}  Total Won : ${this.currentGame.player.haveWon
            } 
        Current RTP : ${winRate.toFixed(2)}% `
        );
        console.log(this.currentGame.player.rtpSpinCount, 'this.currentGame.player.rtpSpinCount');
        console.log("Free spin Count", this.currentGame.player.totalSpin)
        console.log("_____________RESULT_END________________");
    }

    private checkForBonus() {
        if (!this.currentGame.settings.currentGamedata.bonus.isEnabled) return;
        if (this.currentGame.settings.freeSpin.freeSpinStarted) return

        let temp = this.findSymbol(specialIcons.bonus);

        if (this.currentGame.settings.bonus.symbolCount <= temp.length) {

            console.log("Bonus Found Length :  ", temp.length, " Game Type : ", this.currentGame.settings.currentGamedata.bonus.type);
            this.currentGame.settings._winData.winningSymbols.push(temp);
            this.currentGame.settings.bonus.start = true;
            this.currentGame.settings.noOfBonus++;

            if (this.currentGame.settings.currentGamedata.bonus.type == bonusGameType.tap) {

                console.log('TAP')
                this.bonusResult = this.currentGame.settings.bonus.game.generateData();
                this.currentGame.settings._winData.totalWinningAmount += this.currentGame.settings.bonus.game.setRandomStopIndex();
            }


            if (this.currentGame.settings.currentGamedata.bonus.type == bonusGameType.spin)
                this.currentGame.settings._winData.totalWinningAmount += this.currentGame.settings.bonus.game.setRandomStopIndex();


        }

        // if (temp.length > 0) bonusSymbols.push(...temp);
        // this.bonusPaytable.forEach((element) => {
        //     // console.log(element.symbolCount, 'BONUS symbol', " bonusSymbols.length ", temp.length)
        //     if (

        //     ) {
        //         console.log('BONUS', temp)
        //        
        //     } else {
        //       
        //     }
        // });
    }

    private checkForFreeSpin() {
        let temp = this.findSymbol(specialIcons.FreeSpin);

        if (temp.length > this.currentGame.settings.freeSpin.freeSpinMuiltiplier.length - 1) {
            const freeSpins = this.accessData(this.currentGame.settings.freeSpin.symbolID, temp.length)
            this.currentGame.settings.freeSpin.freeSpinStarted = true;
            this.currentGame.settings.freeSpin.freeSpinCount += freeSpins;
            this.currentGame.player.totalSpin += freeSpins;
            this.currentGame.player.rtpSpinCount += freeSpins;

            this.currentGame.settings._winData.winningSymbols.push(temp);
        }
    }

    //check for win function
    private checkForWin() {
        try {
            const winningLines = [];
            let totalPayout = 0;
            this.currentGame.settings.lineData.forEach((line, index) => {
                const firstSymbolPosition = line[0];
                let firstSymbol = this.currentGame.settings.resultSymbolMatrix[firstSymbolPosition][0];

                if (firstSymbol === this.currentGame.settings.wildSymbol.SymbolID.toString()) {
                    firstSymbol = this.findFirstNonWildSymbol(line);
                }
                const { isWinningLine, matchCount, matchedIndices } = this.checkLineSymbols(firstSymbol, line);
                if (isWinningLine && matchCount >= 3) {
                    const symbolMultiplier = this.accessData(firstSymbol, matchCount);
                    console.log(matchedIndices)
                    if (symbolMultiplier > 0) {
                        totalPayout += symbolMultiplier;
                        this.currentGame.settings._winData.winningLines.push(index);
                        winningLines.push({
                            line,
                            symbol: firstSymbol,
                            multiplier: symbolMultiplier,
                            matchCount
                        });
                        const formattedIndices = matchedIndices.map(({ col, row }) => `${col},${row}`);
                        const validIndices = formattedIndices.filter(index => index.length > 2);
                        if (validIndices.length > 0) {
                            this.currentGame.settings._winData.winningSymbols.push(validIndices);
                        }
                    }
                }
            });

            this.currentGame.settings._winData.totalWinningAmount = totalPayout * this.currentGame.settings.BetPerLines
            return winningLines;
        } catch (error) {
            // console.error("Error in checkForWin");
            return [];
        }
    }



    //checking matching lines with first symbol and wild subs
    private checkLineSymbols(firstSymbol, line) {
        try {
            const wildSymbol = this.currentGame.settings.wildSymbol.SymbolID.toString();
            let matchCount = 1;
            let currentSymbol = firstSymbol;
            const matchedIndices = [{ col: 0, row: line[0] }];

            for (let i = 1; i < line.length; i++) {
                const rowIndex = line[i];
                const symbol = this.currentGame.settings.resultSymbolMatrix[rowIndex][i];

                if (symbol === undefined) {
                    console.error(`Symbol at position [${rowIndex}, ${i}] is undefined.`);
                    return { isWinningLine: false, matchCount: 0, matchedIndices: [] };
                }

                if (symbol === currentSymbol || symbol === wildSymbol) {
                    matchCount++;
                    matchedIndices.push({ col: i, row: rowIndex });
                } else if (currentSymbol === wildSymbol) {
                    currentSymbol = symbol;
                    matchCount++;
                    matchedIndices.push({ col: i, row: rowIndex });
                } else {
                    break;
                }
            }

            return { isWinningLine: matchCount >= 3, matchCount, matchedIndices };
        } catch (error) {
            console.error("Error in checkLineSymbols:", error);
            return { isWinningLine: false, matchCount: 0, matchedIndices: [] };
        }
    }

    // [
    //     ['0,0', '0,1', '0,2', '0,3', '0,4'],
    //     ['0,1', '1,1', '1,2', '1,3', '1,4'],
    //     ['0,2', '2,1', '2,2', '2,3', '2,4'],
    // ]

    //checking first non wild symbol in lines which start with wild symbol
    private findFirstNonWildSymbol(line) {
        try {
            const wildSymbol = this.currentGame.settings.wildSymbol.SymbolID.toString();
            for (let i = 0; i < line.length; i++) {
                const rowIndex = line[i];
                const symbol = this.currentGame.settings.resultSymbolMatrix[rowIndex][i];
                if (symbol !== wildSymbol) {
                    return symbol;
                }
            }
            return wildSymbol;
        } catch (error) {
            // console.error("Error in findFirstNonWildSymbol:");
            return null;
        }
    }

    //payouts to user according to symbols count in matched lines
    private accessData(symbol, matchCount) {
        try {
            // console.log("Symbol:",symbol);

            const symbolData = this.currentGame.settings.currentGamedata.Symbols.find(s => s.Id.toString() === symbol.toString());
            if (symbolData) {
                const multiplierArray = symbolData.multiplier;
                if (multiplierArray && multiplierArray[5 - matchCount]) {
                    if (symbol == this.currentGame.settings.freeSpin.symbolID) {
                        return multiplierArray[5 - matchCount][1];
                    } else if (symbol == this.currentGame.settings.scatter.symbolID) {
                        return multiplierArray[5 - matchCount][0];
                    }
                    {
                        return multiplierArray[5 - matchCount][0]
                    }
                }
            }
            return 0;
        } catch (error) {
            // console.error("Error in accessData:");
            return 0;
        }
    }

    //special case for Scatter
    private checkForScatter() {
        this.scatterWinSymbols = [];
        if (this.currentGame.settings.scatter.useScatter) {
            let temp = this.findSymbol(specialIcons.scatter);
            if (temp.length > this.currentGame.settings.scatter.multiplier.length - 1) {
                const winningAmount = this.accessData(this.currentGame.settings.scatter.symbolID, temp.length);
                this.currentGame.settings._winData.totalWinningAmount += winningAmount * this.currentGame.settings.BetPerLines;
                this.currentGame.settings._winData.winningSymbols.push(temp);

            }
        }
    }

    //special case for Jackpot
    private checkForJackpot() {
        if (this.useJackpot) {
            var temp = this.findSymbol(specialIcons.jackpot);
            if (temp.length > 0) this.jackpotWinSymbols.push(...temp);
            if (
                this.jackpot.symbolsCount > 0 &&
                this.jackpot.symbolsCount == this.jackpotWinSymbols.length
            ) {
                // console.log("!!!!!JACKPOT!!!!!");
                this.currentGame.settings._winData.winningSymbols.push(this.jackpotWinSymbols);
                this.currentGame.settings._winData.totalWinningAmount += this.jackpot.defaultAmount * this.currentGame.settings.BetPerLines;;
                this.currentGame.settings._winData.jackpotwin += this.jackpot.defaultAmount * this.currentGame.settings.BetPerLines;;
            }
        }
    }
    //finding Symbols for special case element
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
                symbolsToEmit: this.currentGame.settings._winData.winningSymbols,
                WinAmout: this.currentGame.settings._winData.totalWinningAmount,
                freeSpins: this.currentGame.settings.freeSpin.freeSpinCount,
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

    // private removeRecurringIndexSymbols(symbolsToEmit: string[][]): string[][] {
    //     const seen = new Set<string>();
    //     const result: string[][] = [];

    //     symbolsToEmit.forEach((subArray) => {
    //         if (!Array.isArray(subArray)) {
    //             return;
    //         }
    //         const uniqueSubArray: string[] = [];
    //         subArray.forEach((symbol) => {
    //             if (!seen.has(symbol)) {
    //                 seen.add(symbol);
    //                 uniqueSubArray.push(symbol);
    //             }
    //         });
    //         if (uniqueSubArray.length > 0) {
    //             result.push(uniqueSubArray);
    //         }
    //     });

    //     return result;
    // }


    private startFreeSpin() {
        this.currentGame.sendMessage('StartedFreeSpin', {})
        this.currentGame.settings.freeSpin.freeSpinStarted = true;
        this.currentGame.sendMessage("StoppedFreeSpins", {});
    }
}