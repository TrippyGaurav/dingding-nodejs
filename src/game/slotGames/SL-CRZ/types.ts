import { GameData } from "../BaseSlotGame/gameType";
import { WinData } from "../BaseSlotGame/WinData";
export interface Symbol {
    Name: string;
    Id: number;
    payout: string;
    reelInstance: { [key: string]: number };
}

export interface CRZSETTINGS {
    id: string;
    isSpecial: boolean;
    matrix: { x: number, y: number };
    currentGamedata: GameData;
    resultSymbolMatrix: any[];
    _winData: WinData | undefined;
    canmatch : number[];
    mixedPayout : number;
    currentBet: number;
    currentLines: number;
    BetPerLines: number;
    bets: number[];
    reels: any[][];
    Symbols: Symbol[];
}