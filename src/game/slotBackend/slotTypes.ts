
import { Socket } from "socket.io";
import { bonusGame, GambleGame } from "./extraBonusGames";
import { WinData } from "./slotResults";

export interface SymbolData {
    symbolName: string;
    symbolID: number;
    useWildSub: boolean;
    multiplier: number[];
    freespins: number;
  }
  
  export enum specialIcons {
    bonus = "Bonus",
    scatter = "Scatter",
    jackpot = "Jackpot",
    wild = "Wild",
    any = "any",
  }
  
  export enum bonusGameType {
    tap = "tap",
    spin = "spin",
    default = "default",
  }
  export interface PlayerData {
    Balance: number;
    haveWon: number;
    currentWining: number;
    playerId: string,
    // haveUsed: number
  }
  export interface PayLine {
    line: string[];
    pay: number;
    freeSpins: number;
  }
  export interface ScatterPayEntry {
    symbolCount: number;
    symbolID: number;
    pay: number;
    freeSpins: number;
  }
  export interface BonusPayEntry {
    symbolCount: number;
    symbolID: number;
    pay: number;
    highestPayMultiplier: number;
  }
  
  export interface WildSymbol {
    SymbolName: string;
    SymbolID: number;
  }
  
  export interface WeightedItem<T> {
    item: T;
    index: number;
  }
  export interface winning {
    winningSymbols: any[];
    WinningLines: any[];
    TotalWinningAmount: number;
    shouldFreeSpin: boolean;
    freeSpins: number;
    currentBet: number;
  }
  
  export interface GameSettings {
    currentGamedata: any;
    matrix: { x: number; y: number };
    payLine: PayLine[];
    scatterPayTable: ScatterPayEntry[];
    bonusPayTable: BonusPayEntry[];
    useScatter: boolean;
    useWild: boolean;
    Symbols: string[];
    Weights: number[];
    wildSymbol: WildSymbol;
    resultSymbolMatrix: string[][] | undefined;
    lineData: number[][];
    fullPayTable: PayLine[];
    freeSpinStarted: boolean;
    resultReelIndex: number[],
    noOfBonus: number,
    noOfFreeSpins: number,
    totalBonuWinAmount: number[],
    jackpot: {
      symbolName: string;
      symbolId: number;
      symbolsCount: number;
      defaultAmount: number;
      increaseValue: number;
    };
    _winData: WinData;
    bonus: {
      game: bonusGame;
      start: boolean;
      stopIndex: number;
      id: number;
      // maxPay: number
    };
    tempReels: string[][];
    reels: string[][];
    currentBet: number;
    BetPerLines: number,
    currentLines: number,
    startGame: boolean;
    initiate: (playerSkt : Socket ,arg: any, arg2: string) => void;
    gamble: {
      game: GambleGame;
      maxCount: number;
      start: boolean;
    };
  }
  
  export enum ResultType {
    moolah = "moolah",
    normal = "normal",
  }
  