
export interface Symbol {
  Name: string;
  Id: number;
  isSpecial: boolean;
  reelInstance: { [key: number]: number };
  payout: number[];
}
