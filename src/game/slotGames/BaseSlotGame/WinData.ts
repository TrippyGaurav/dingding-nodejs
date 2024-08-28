import SlotGame from "../slotGame";
import BaseSlotGame from "./BaseGlobal";

export class WinData {
    freeSpins: number;
    winningSymbols: any[];
    winningLines: any[];
    totalWinningAmount: number;
    jackpotwin: number;
    resultReelIndex: number[] = [];
    slotGame: BaseSlotGame;

    constructor(slotGame: BaseSlotGame) {
        this.freeSpins = 0;
        this.winningLines = [];
        this.winningSymbols = [];
        this.totalWinningAmount = 0;
        this.jackpotwin = 0;
        this.slotGame = slotGame;
    }

    async updateBalance() {
        this.slotGame.updatePlayerBalance(this.totalWinningAmount);
        this.slotGame.playerData.haveWon += this.totalWinningAmount;
    this.slotGame.playerData.currentWining = this.totalWinningAmount;
        // TODO: Need to work here

    }
}
