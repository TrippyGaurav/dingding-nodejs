import { Socket } from "socket.io";
import { GameData, GameSettings, WildSymbol } from "../../dashboard/games/gameType";
import {
    messageType,
    bonusGameType,
    convertSymbols,
    shuffleArray,
    specialIcons,
    UiInitData,
    betMultiplier,
    ResultType,
} from "./gameUtils";
import { BonusGame } from "./BonusGame";
import { WinData } from "./WinData";
import { Player } from "../../dashboard/users/userModel";
import { RandomResultGenerator } from "./RandomResultGenerator";
import { CheckResult } from "./CheckResult";
import { gambleCardGame } from "./newGambleGame";
import mongoose from "mongoose";
export default class SlotGame {
    public settings: GameSettings;

    public player: {
        username: string,
        credits: number,
        haveWon: number,
        currentWining: number,
        socket: Socket
        totalbet: number,
        rtpSpinCount: number
        totalSpin: number
    }
    constructor(player: { username: string, credits: number, socket: Socket }, GameData: any) {
        this.player = { ...player, haveWon: 0, currentWining: 0, totalbet: 0, rtpSpinCount: 0, totalSpin: 0 };
        this.settings = {
            currentGamedata: {
                id: "",
                linesApiData: [],
                Symbols: [
                    {
                        Name: "",
                        Id: null,
                        weightedRandomness: 0,
                        useWildSub: false,
                        multiplier: [],
                        defaultAmount: [],
                        symbolsCount: [],
                        increaseValue: [],
                        reelInstance: [], // Ensure reelInstance is initialized
                    },
                ],
                bonus: {
                    isEnabled: false,
                    type: "",
                    noOfItem: 0,
                    payOut: [], // Ensure payOut is initialized
                    payOutProb: [], // Ensure payOutProb is initialized
                    payTable: [], // Ensure payTable is initialized
                },
                bets: [], // Ensure bets is initialized
                linesCount: 0, // Ensure linesCount is initialized
            },
            tempReels: [[]],
            matrix: { x: 5, y: 3 },
            payLine: [],
            useScatter: false,
            wildSymbol: {
                SymbolName: "-1",
                SymbolID: -1,
                useWild: false
            },
            Symbols: [],
            Weights: [],
            resultSymbolMatrix: [],
            lineData: [],
            fullPayTable: [],
            _winData: undefined,

            resultReelIndex: [],
            noOfBonus: 0,
            totalBonuWinAmount: [],
            jackpot: {
                symbolName: "",
                symbolsCount: 0,
                symbolId: 0,
                defaultAmount: 0,
                increaseValue: 0,
                useJackpot: false,
            },
            bonus: {
                start: false,
                stopIndex: -1,
                game: null,
                id: -1,
                symbolCount: -1,
                pay: -1,
                useBonus: false,
            },
            freeSpin: {
                symbolID: "-1",
                freeSpinMuiltiplier: [],
                freeSpinStarted: false,
                freeSpinsAdded: false,
                freeSpinCount: 0,
                noOfFreeSpins: 0,
                useFreeSpin: false,
            },
            scatter: {
                symbolID: "-1",
                multiplier: [],
                useScatter: false
            },
            currentBet: 0,
            currentLines: 0,
            BetPerLines: 0,
            startGame: false,
            gamble: new gambleCardGame(this),
            reels: [[]],
            currentMoolahCount: 0,
        };

        this.initialize(GameData);
        this.messageHandler();

    }

    private initialize(GameData: GameData) {
        this.settings.Symbols = [];
        this.settings.Weights = [];
        this.settings._winData = new WinData(this);
        this.settings.currentGamedata = GameData[0] || GameData;
        this.initSymbols();
        UiInitData.paylines = convertSymbols(this.settings.currentGamedata.Symbols);
        this.settings.startGame = true;
        this.makePayLines();
        this.sendInitdata();
    }

    public sendMessage(action: string, message: any) {
        this.player.socket.emit(
            messageType.MESSAGE,
            JSON.stringify({ id: action, message, username: this.player.username })
        );
    }

    public sendError(message: string) {
        this.player.socket.emit(messageType.ERROR, message);
    }

    public sendAlert(message: string) {
        this.player.socket.emit(messageType.ALERT, message);
    }

    private messageHandler() {
        this.player.socket.on("message", (message) => {
            try {
                const res = JSON.parse(message);
                console.log("Message Recieved : ", message);


                switch (res.id) {
                    case "SPIN":
                        // if (this.settings.currentBet > this.player.credits) {
                        //     this.sendError("Low Balance");
                        //     break;
                        // }
                        if (this.settings.startGame) {
                            this.settings.currentLines = res.data.currentLines;
                            this.settings.BetPerLines = betMultiplier[res.data.currentBet];

                            this.settings.currentBet = betMultiplier[res.data.currentBet] * this.settings.currentLines;

                            this.spinResult();
                        }
                        break;

                    case "GENRTP":
                        // if (this.settings.currentBet > this.player.credits) {
                        //     this.sendError("Low Balance");
                        //     break;
                        // }

                        this.settings.currentLines = res.data.currentLines;
                        this.settings.BetPerLines = betMultiplier[res.data.currentBet];
                        this.settings.currentBet =
                            betMultiplier[res.data.currentBet] * this.settings.currentLines;


                        this.getRTP(res.data.spins);
                        break;

                    case "checkMoolah":
                        this.checkforMoolah();
                        break;

                    case "GambleInit":
                        this.settings.gamble.resetGamble();

                        const sendData = this.settings.gamble.sendInitGambleData(
                            res.data.GAMBLETYPE
                        );
                        console.log(sendData);

                        this.sendMessage("gambleInitData", sendData);
                        break;

                    case "GambleResultData":
                        this.settings.gamble.getResult(res.data.GAMBLETYPE);
                        break;
                    case "GAMBLECOLLECT":
                        this.settings.gamble.updateCredits();
                        break;
                    default:
                        console.warn(`Unhandled message ID: ${res.id}`);
                        this.sendError(`Unhandled message ID: ${res.id}`);
                        break;
                }
            } catch (error) {
                console.error("Failed to parse message:", error);
                this.sendError("Failed to parse message");
            }
        });
    }

    public async updateDatabase() {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const finalBalance = this.player.credits;

            await Player.findOneAndUpdate(
                { username: this.player.username },
                { credits: finalBalance.toFixed(2) },
                { new: true, session }
            );

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            console.error("Failed to update database:", error);
            if (error.message.includes("Write conflict")) {
                // Retry logic could be added here
            }

            this.sendError("Database error");
        } finally {
            session.endSession();
        }
    }


    private checkPlayerBalance() {
        if (this.player.credits < this.settings.currentBet) {
            this.sendMessage("low-balance", true);
            console.error("LOW BALANCE");
            return;
        }
    }

    async updatePlayerBalance(credit: number) {
        try {
            this.player.credits += credit;
            this.player.haveWon += credit;
            this.player.currentWining = credit;
            await this.updateDatabase();

        } catch (error) {
            console.error("Error updating credits in database:", error);
        }
    }

    async deductPlayerBalance(credit: number) {
        this.checkPlayerBalance();
        this.player.credits -= credit;
        // await this.updateDatabase();
    }

    private initSymbols() {
        for (let i = 0; i < this.settings.currentGamedata.Symbols.length; i++) {
            this.settings.Symbols.push(
                this.settings.currentGamedata.Symbols[i].Id?.toString(),
                this.settings.currentGamedata.Symbols[i].multiplier
            );
            this.settings.Weights.push(
                this.settings.currentGamedata.Symbols[i]?.weightedRandomness
            );
        }
    }

    private makePayLines() {
        this.settings.currentGamedata.Symbols.forEach((element) => {
            if (element.useWildSub) {
                element.multiplier?.forEach((item, index) => {
                    this.addPayLineSymbols(
                        element.Id?.toString(),
                        5 - index,
                        item[0],
                        item[1]
                    );
                });
            } else {
                this.handleSpecialSymbols(element);

            }
        });
    }

    private addPayLineSymbols(
        symbol: string,
        repetition: number,
        pay: number,
        freeSpins: number
    ) {
        const line: string[] = Array(repetition).fill(symbol); // Create an array with 'repetition' number of 'symbol'

        if (line.length != this.settings.matrix.x) {
            let lengthToAdd = this.settings.matrix.x - line.length;
            for (let i = 0; i < lengthToAdd; i++) line.push("any");
        }

        this.settings.payLine.push({ line: line, pay: pay, freeSpins: freeSpins });
    }

    private handleSpecialSymbols(symbol: any) {

        switch (symbol.Name) {

            case specialIcons.FreeSpin:
                this.settings.freeSpin.symbolID = symbol.Id;
                this.settings.freeSpin.freeSpinMuiltiplier = symbol.multiplier;
                this.settings.freeSpin.useFreeSpin = true;
                break;

            case specialIcons.jackpot:
                this.settings.jackpot.symbolName = symbol.Name;
                this.settings.jackpot.symbolId = symbol.Id;
                this.settings.jackpot.symbolsCount = symbol.symbolsCount;
                this.settings.jackpot.defaultAmount = symbol.defaultAmount;
                this.settings.jackpot.increaseValue = symbol.increaseValue;
                this.settings.jackpot.useJackpot = true;

                break;

            case specialIcons.wild:
                this.settings.wildSymbol.SymbolName = symbol.Name;
                this.settings.wildSymbol.SymbolID = symbol.Id;
                this.settings.wildSymbol.useWild = true;
                break;

            case specialIcons.scatter:

                this.settings.scatter.symbolID = symbol.Id,
                    this.settings.scatter.multiplier = symbol.multiplier;
                this.settings.scatter.useScatter = true;

                break;

            case specialIcons.bonus:
                this.settings.bonus.id = symbol.Id;
                this.settings.bonus.symbolCount = symbol.symbolCount;
                this.settings.bonus.pay = symbol.pay;
                this.settings.bonus.useBonus = true;
                break;

            default:
                break;
        }
    }

    public sendInitdata() {
        this.settings.lineData = this.settings.currentGamedata.linesApiData;
        this.settings.reels = this.generateInitialreel();

        if (
            this.settings.currentGamedata.bonus.isEnabled &&
            this.settings.currentGamedata.bonus.type == bonusGameType.spin
        ) {
            this.settings.bonus.game = new BonusGame(
                this.settings.currentGamedata.bonus.noOfItem,
                this
            );
        }

        let specialSymbols = this.settings.currentGamedata.Symbols.filter(
            (element) => !element.useWildSub
        );

        const dataToSend = {
            GameData: {
                Reel: this.settings.reels,
                Lines: this.settings.currentGamedata.linesApiData,
                Bets: this.settings.currentGamedata.bets,
                canSwitchLines: false,
                LinesCount: this.settings.currentGamedata.linesCount,
                autoSpin: [1, 5, 10, 20],
            },
            // TODO: Unknown source of generateData()
            BonusData:
                this.settings.bonus.game != null
                    ? this.settings.bonus.game.generateData(
                        this.settings.bonus.pay
                    )
                    : [],
            UIData: UiInitData,
            PlayerData: {
                Balance: this.player.credits,
                haveWon: this.player.haveWon,
                currentWining: this.player.currentWining,
                totalbet: this.player.totalbet
            },
            maxGambleBet: 300,
        };

        this.sendMessage("InitData", dataToSend);
    }

    private generateInitialreel(): string[][] {
        let matrix: string[][] = [];

        for (let i = 0; i < this.settings.matrix.x; i++) {
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


    private async spinResult() {
        try {
            if (this.settings.currentBet > this.player.credits) {
                console.log("Low Balance : ", this.player.credits);
                console.log("Current Bet : ", this.settings.currentBet);
                this.sendError("Low Balance");
                return
            }
            if (this.settings.currentGamedata.bonus.isEnabled && this.settings.currentGamedata.bonus.type == bonusGameType.tap) {
                this.settings.bonus.game = new BonusGame(this.settings.currentGamedata.bonus.noOfItem, this)
            }
            /*
            MIDDLEWARE GOES HERE
            */
            if (!this.settings.freeSpin.freeSpinStarted && this.settings.freeSpin.freeSpinCount === 0) {
                await this.deductPlayerBalance(this.settings.currentBet);
            }
            if (this.settings.freeSpin.freeSpinStarted && this.settings.freeSpin.freeSpinCount > 0) {
                this.settings.freeSpin.freeSpinCount--;
                this.settings.freeSpin.freeSpinsAdded = false;
                console.log(this.settings.freeSpin.freeSpinCount, 'this.settings.freeSpinCount');

                if (this.settings.freeSpin.freeSpinCount <= 0) {
                    this.settings.freeSpin.freeSpinStarted = false;
                    this.settings.freeSpin.freeSpinsAdded = false;
                }
            }
            this.settings.tempReels = [[]];
            this.settings.bonus.start = false;
            this.player.totalbet += this.settings.currentBet
            new RandomResultGenerator(this);
            const result = new CheckResult(this)
            result.makeResultJson(ResultType.normal)

        } catch (error) {
            console.error("Failed to generate spin results:", error);
            this.sendError("Spin error");
        }
    }


    private getRTP(spins: number) {
        try {
            let spend: number = 0;
            let won: number = 0;
            this.player.rtpSpinCount = spins;
            for (let i = 0; i < this.player.rtpSpinCount; i++) {
                this.spinResult();
                spend += this.settings.currentBet;
                won = this.settings._winData.totalWinningAmount;
            }
            let rtp = 0;
            if (spend > 0) {
                rtp = won / spend;
            }





            return

        } catch (error) {
            console.error("Failed to calculate RTP:", error);
            this.sendError("RTP calculation error");
        }
    }

    public checkforMoolah() {
        try {
            this.settings.tempReels = this.settings.reels;

            const lastWinData = this.settings._winData


            lastWinData.winningSymbols = this.combineUniqueSymbols(
                this.removeRecurringIndexSymbols(lastWinData.winningSymbols)
            );

            const index = lastWinData.winningSymbols.map((str) => {
                const index: { x; y } = str.split(",").map(Number);
                return index;
            });

            let matrix = [];
            matrix = this.settings.resultSymbolMatrix;

            index.forEach((element) => {
                matrix[element[1]][element[0]] = null;
            });

            const movedArray = this.cascadeMoveTowardsNull(matrix);

            let transposed = this.transposeMatrix(movedArray);
            let iconsToFill: number[][] = [];
            for (let i = 0; i < transposed.length; i++) {
                let row = [];
                for (let j = 0; j < transposed[i].length; j++) {
                    if (transposed[i][j] == null) {
                        let index =
                            (this.settings.resultReelIndex[i] + j + 2) %
                            this.settings.tempReels[i].length;
                        transposed[i][j] = this.settings.tempReels[i][index];
                        row.unshift(this.settings.tempReels[i][index]);
                        this.settings.tempReels[i].splice(j, 1);
                    }
                }
                if (row.length > 0) iconsToFill.push(row);
            }

            matrix = this.transposeMatrix(transposed);



            this.settings.resultSymbolMatrix = matrix;



            // tempGame.
            const result = new CheckResult(this);
            result.makeResultJson(ResultType.moolah, iconsToFill);
            this.settings._winData.winningSymbols = []
            this.settings.tempReels = []
        } catch (error) {
            console.error("Failed to check for Moolah:", error);
            this.sendError("Moolah check error");
            return error
        }
    }

    private combineUniqueSymbols(symbolsToEmit: string[][]): string[] {
        const seen = new Set<string>();
        const result: string[] = [];

        symbolsToEmit.forEach((subArray) => {
            subArray.forEach((symbol) => {
                if (!seen.has(symbol)) {
                    seen.add(symbol);
                    result.push(symbol);
                }
            });
        });

        return result;
    }

    private removeRecurringIndexSymbols(symbolsToEmit: string[][]): string[][] {
        const seen = new Set<string>();
        const result: string[][] = [];

        symbolsToEmit.forEach((subArray) => {
            if (!Array.isArray(subArray)) {
                console.warn("Expected an array but got", subArray);
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

    private cascadeMoveTowardsNull(
        arr: (string | null)[][]
    ): (string | null)[][] {
        if (arr.length === 0 || arr[0].length === 0) return arr;
        const numRows = arr.length;
        const numCols = arr[0].length;

        let result: (string | null)[][] = Array.from({ length: numRows }, () =>
            new Array(numCols).fill(null)
        );

        for (let col = 0; col < numCols; col++) {
            let newRow = numRows - 1;

            // Place non-null elements starting from the bottom
            for (let row = numRows - 1; row >= 0; row--) {
                if (arr[row][col] !== null) {
                    result[newRow][col] = arr[row][col];
                    newRow--;
                }
            }

            // Fill the top positions with null if there are remaining positions
            for (let row = newRow; row >= 0; row--) {
                result[row][col] = null;
            }
        }

        return result;
    }

    private transposeMatrix(matrix) {
        let transposed = [];

        for (let i = 0; i < matrix[0].length; i++) {
            let newRow = [];
            for (let j = 0; j < matrix.length; j++) {
                newRow.push(matrix[j][i]);
            }
            transposed.push(newRow);
        }

        return transposed;
    }
}
