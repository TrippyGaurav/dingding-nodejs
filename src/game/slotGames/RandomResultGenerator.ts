import SlotGame from "./slotGame";

export class RandomResultGenerator {

    currentGame: SlotGame;
    constructor(current) {
        console.log('hello')
        let matrix: string[][] = [];
        for (let x = 0; x < current.settings.matrix.x; x++) {
            const startPosition = this.getRandomIndex((current.settings.reels[x].length - 1));

            for (let y = 0; y < current.settings.matrix.y; y++) {
                if (!matrix[y]) matrix[y] = [];
                matrix[y][x] = current.settings.reels[x][(startPosition + y) % current.settings.reels[x].length];
            }
        }
        current.settings.resultReelIndex = matrix;
        current.settings.resultSymbolMatrix = matrix;
    }
    getRandomIndex(maxValue: number): number {
        return Math.floor(Math.random() * (maxValue + 1));
    }


}

