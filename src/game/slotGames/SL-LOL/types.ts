export interface SymbolType {
  Name: string;
  Id: number;
  isSpecial: boolean;
  reelInstance: { [key: number]: number };
  payout: number[];
}

export type GameResult = number[][];

export interface GameConfig {
  rows: number;
  reels: number;
  minMatchCount: number;
}

export interface WinningCombination {
  symbolId: number;
  positions: [number, number][];
  payout: number;
}

export interface SLLOLSETTINGS {
  id: string;
  isSpecial: boolean;
  isEnabled:boolean;
  matrix: number[][];
  bets: number[];
  Symbols: SymbolType[];
  resultSymbolMatrix: number[][];
  currentGamedata: any;
  _winData: any;
  // canmatch: any[];
  // mixedPayout: number;
  currentBet: number;
  currentLines: number;
  BetPerLines: number;
  reels: number[][];
  defaultPayout: number;
  // SpecialType: string;
  // isSpecialLOL: boolean;
  // symbolsCount: number;
}
