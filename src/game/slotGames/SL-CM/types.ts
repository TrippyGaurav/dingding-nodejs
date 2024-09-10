import { GameData } from "../BaseSlotGame/gameType";
import { WinData } from "../BaseSlotGame/WinData";

export interface Symbol {
    Name: string;
    Id: number;
    payout: string;
    canCallRedSpin: boolean;
    canCallRespin: boolean;
    reelInstance: { [key: string]: number };
}

export interface CMSettings {
    id: string;
    isSpecial: boolean;
    matrix: { x: number, y: number };
    currentGamedata: GameData;
    resultSymbolMatrix: any[];
    _winData: WinData | undefined;
    currentBet: number;
    currentLines: number;
    BetPerLines: number;
    bets: number[];
    reels: any[][];
    Symbols: Symbol[];
    lastReSpin: any[];    // To store the matrix before respin
    freezeIndex: number[]; // Indexes where 0 and 00 are found
    newMatrix: any[];     // To store the matrix after replacement of frozen indexes
    initialRedRespinMatrix?: any[];
}