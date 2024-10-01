
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
        matrix.forEach(row => console.log(row.join(' ')));

        // matrix.pop();
        // matrix.pop();
        // matrix.pop();
        // matrix.push(['4', '4', '5', '4', '2'])
        // matrix.push(['1', '6', '2', '4', '2'])
        // matrix.push(['13', '13', '1', '13', '2'])
        current.settings.resultReelIndex = matrix;
        current.settings.resultSymbolMatrix = matrix;

    }
    getRandomIndex(maxValue: number): number {
        return Math.floor(Math.random() * (maxValue + 1));
    }

}

