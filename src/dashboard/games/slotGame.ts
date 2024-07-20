import { Socket } from "socket.io";
import { GameData, GameSettings, WildSymbol } from "./gameType";
import { messageType, bonusGameType, convertSymbols, shuffleArray, specialIcons, UiInitData } from "./gameUtils";
import { BonusGame } from "./BonusGame";
import { WinData } from "./WinData";
import { Player } from "../users/userModel";
import PayLines from "./PayLines";

export default class SlotGame {
    public settings: GameSettings;

    public player: {
        username: string,
        credits: number,
        haveWon: number,
        currentWining: number,
        socket: Socket
    }

    constructor(player: { username: string, credits: number, socket: Socket }, GameData: GameData) {
        this.player = { ...player, haveWon: 0, currentWining: 0 };
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
            scatterPayTable: [],
            bonusPayTable: [],
            useScatter: false,
            useWild: false,
            wildSymbol: {} as WildSymbol,
            Symbols: [],
            Weights: [],
            resultSymbolMatrix: [],
            lineData: [],
            fullPayTable: [],
            _winData: undefined,
            freeSpinStarted: false,
            resultReelIndex: [],
            noOfBonus: 0,
            noOfFreeSpins: 0,
            totalBonuWinAmount: [],
            jackpot: {
                symbolName: "",
                symbolsCount: 0,
                symbolId: 0,
                defaultAmount: 0,
                increaseValue: 0,
            },
            bonus: {
                start: false,
                stopIndex: -1,
                game: null,
                id: -1,
            },
            currentBet: 0,
            currentLines: 0,
            BetPerLines: 0,
            startGame: false,
            gamble: {
                game: null,
                maxCount: 1,
                start: false,
            },
            reels: [[]],
        };
        this.initialize(GameData)
    }

    private sendMessage(action: string, message: any) {
        this.player.socket.emit(messageType.MESSAGE, JSON.stringify({ id: action, message }))
    }

    async updatePlayerBalance(credit: number) {
        try {
            this.player.credits += credit;
            this.player.haveWon += credit;
            this.player.currentWining = credit;

            console.log("FINAL BALANCE : ", this.player.credits);

            const result = await Player.findOneAndUpdate(
                { username: this.player.username },
                { credits: this.player.credits },
                { new: true }
            )

            if (!result) {
                console.log(`Player with username ${this.player.username} not found in database.`);
            }
            else {
                console.log(`Updated credits for player ${this.player.username} to ${this.player.credits}.`);
            }
        } catch (error) {
            console.error('Error updating credits in database:', error);
        }
    }

    private initialize(GameData: GameData) {
        this.settings.bonusPayTable = [];
        this.settings.scatterPayTable = [];
        this.settings.Symbols = [];
        this.settings.Weights = [];
        this.settings._winData = new WinData(this);

        this.settings.currentGamedata = GameData[0] || GameData;
        this.settings.currentGamedata.Symbols.forEach((element) => {
            if (element.Name === "Bonus") {
                this.settings.bonus.id = element.Id
            }
        })
        this.initSymbols();
        UiInitData.paylines = convertSymbols(this.settings.currentGamedata.Symbols);
        this.settings.startGame = true;

        this.makePayLines();
        this.sendInitdata()
    }

    private initSymbols() {
        for (let i = 0; i < this.settings.currentGamedata.Symbols.length; i++) {
            this.settings.Symbols.push(this.settings.currentGamedata.Symbols[i].Id?.toString());
            this.settings.Weights.push(this.settings.currentGamedata.Symbols[i]?.weightedRandomness);
        }
    }

    private makePayLines() {
        this.settings.currentGamedata.Symbols.forEach((element) => {
            if (element.useWildSub || element.Name == "FreeSpin" || element.Name == "Scatter") {
                element.multiplier?.forEach(((item, index) => {
                    this.addPayLineSymbols(element.Id?.toString(), 5 - index, item[0], item[1]);
                }))
            }
            else {
                this.handleSpecialSymbols(element)
            }
        })
    }

    private addPayLineSymbols(symbol: string, repetition: number, pay: number, freeSpins: number) {
        const line: string[] = Array(repetition).fill(symbol); // Create an array with 'repetition' number of 'symbol'

        if (line.length != this.settings.matrix.x) {
            let lengthToAdd = this.settings.matrix.x - line.length;
            for (let i = 0; i < lengthToAdd; i++) line.push("any");
        }

        this.settings.payLine.push({ line: line, pay: pay, freeSpins: freeSpins })
    }

    private handleSpecialSymbols(symbol: any) {
        this.settings.bonusPayTable = [];
        this.settings.scatterPayTable = [];

        switch (symbol.Name) {
            case specialIcons.jackpot:
                this.settings.jackpot.symbolName = symbol.Name;
                this.settings.jackpot.symbolId = symbol.Id;
                this.settings.jackpot.symbolsCount = symbol.symbolsCount;
                this.settings.jackpot.defaultAmount = symbol.defaultAmount;
                this.settings.jackpot.increaseValue = symbol.increaseValue;
                break;

            case specialIcons.wild:
                this.settings.wildSymbol.SymbolName = symbol.Name;
                this.settings.wildSymbol.SymbolID = symbol.Id;
                this.settings.useWild = true;
                break;

            case specialIcons.scatter:
                this.settings.scatterPayTable.push({
                    symbolCount: symbol.count,
                    symbolID: symbol.Id,
                    pay: symbol.pay,
                    freeSpins: symbol.freeSpin,
                });
                this.settings.useScatter = true;
                break;

            case specialIcons.bonus:
                this.settings.bonusPayTable.push({
                    symbolCount: symbol.symbolCount,
                    symbolID: symbol.Id,
                    pay: symbol.pay,
                    highestPayMultiplier: symbol.highestMultiplier,
                });
                break;

            default:
                break;
        }
    }

    private sendInitdata() {
        this.gameDataInit();
        this.settings.reels = this.generateInitialreel();

        if (this.settings.currentGamedata.bonus.isEnabled && this.settings.currentGamedata.bonus.type == bonusGameType.spin) {
            this.settings.bonus.game = new BonusGame(this.settings.currentGamedata.bonus.noOfItem, this)
        }

        let specialSymbols = this.settings.currentGamedata.Symbols.filter((element) => !element.useWildSub);

        const dataToSend = {
            GameData: {
                Lines: this.settings.currentGamedata.linesApiData,
                Bets: this.settings.currentGamedata.bets,
                canSwitchLines: false,
                LinesCount: this.settings.currentGamedata.linesCount,
                autoSpin: [1, 5, 10, 20],
            },
            // TODO: Unknown source of generateData()
            BonusData: this.settings.bonus.game != null ? this.settings.bonus.game.generateData(this.settings.bonusPayTable[0]?.pay) : [],
            UIData: UiInitData,
            PlayerData: {
                Balance: this.player.credits,
                haveWon: this.player.haveWon,
                currentWining: this.player.currentWining
            }
        };

        this.sendMessage("InitData", dataToSend)
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

    private gameDataInit() {
        this.settings.lineData = this.settings.currentGamedata.linesApiData;
        this.makeFullPayTable()
    }

    private makeFullPayTable() {
        let payTable: PayLines[] = [];
        let payTableFull = [];

        this.settings.payLine.forEach((pLine) => {
            payTable.push(
                new PayLines(pLine.line, pLine.pay, pLine.freeSpins, this.settings.wildSymbol.SymbolName, this)
            )
        });

        for (let j = 0; j < payTable.length; j++) {
            payTableFull.push(payTable[j]);
            if (this.settings.useWild) {
                let wildLines = payTable[j].getWildLines();
                wildLines.forEach((wl) => {
                    payTableFull.push(wl)
                })
            }
        }

        this.settings.fullPayTable = payTableFull;
    }
}


