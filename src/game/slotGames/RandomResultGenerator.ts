
export class RandomResultGenerator {
    constructor(current) {
        let matrix: string[][] = [];
        for (let x = 0; x < current.settings.currentGamedata.matrix.x; x++) {
            const startPosition = this.getRandomIndex((current.settings.reels[x].length - 1));
            for (let y = 0; y < current.settings.currentGamedata.matrix.y; y++) {
                if (!matrix[y]) matrix[y] = [];
                matrix[y][x] = current.settings.reels[x][(startPosition + y) % current.settings.reels[x].length];
            }
        }
        console.log(matrix, 'MATRIX')

        // matrix.pop();
        // matrix.pop();
        // matrix.pop();
        // matrix.push(['10', '0', '0', '8', '8'])
        // matrix.push(['10', '2', '0', '2', '4'])
        // matrix.push(['10', '0', '0', '7', '1'])
        current.settings.resultReelIndex = matrix;
        current.settings.resultSymbolMatrix = matrix;

    }
    getRandomIndex(maxValue: number): number {
        return Math.floor(Math.random() * (maxValue + 1));
    }

}

