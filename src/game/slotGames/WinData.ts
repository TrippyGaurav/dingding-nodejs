import SlotGame from "./slotGame";
export class WinData {
    freeSpins: number;
    winningSymbols: any[];
    winningLines: any[];
    totalWinningAmount: number;
    jackpotwin: number;
    resultReelIndex: number[] = [];
    slotGame: SlotGame;

    constructor(slotGame: SlotGame) {
        this.freeSpins = 0;
        this.winningLines = [];
        this.winningSymbols = [];
        this.totalWinningAmount = 0;
        this.jackpotwin = 0;
        this.slotGame = slotGame;
    }

    async updateBalance() {
        this.slotGame.updatePlayerBalance(this.totalWinningAmount);
        // TODO: Need to work here

    }
}
