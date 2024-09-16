import { GameData } from "../BaseSlotGame/gameType";
import { WinData } from "../BaseSlotGame/WinData";
export interface Symbol {
    Name: string;
    Id: number;
    payout: number;
    canmatch: string[];
    mixedPayout: number;
    defaultPayout: number;
    isSpecial: boolean;
    reelInstance: { [key: string]: number };   
}

export interface WOFSETTINGS {
    id: string;
    isSpecial: boolean;
    matrix: { x: number, y: number };
    currentGamedata: GameData;
    resultSymbolMatrix: any[];
    _winData: WinData | undefined;
    canmatch: string[];
    mixedPayout: number;
    defaultPayout: number;
    currentBet: number;
    currentLines: number;
    BetPerLines: number;
    bets: number[];
    reels: any[][];
    Symbols: Symbol[];
}

export enum WINNINGTYPE {
    REGULAR = 'regular',
    MIXED = 'mixed',
    DEFAULT = 'default'
}

export enum EXTRASYMBOL {
    MULTIPLY = 'MULTIPLY',
    ADD = 'ADD',
    RESPIN = 'RESPIN'
}