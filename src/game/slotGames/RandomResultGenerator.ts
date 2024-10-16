
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

        matrix.pop();
        matrix.pop();
        matrix.pop();
        matrix.push(['4', '9', '9', '9', '9'])
        matrix.push(['1', '6', '2', '9', '2'])
        matrix.push(['9', '3', '1', '13', '9'])
        current.settings.resultReelIndex = matrix;
        current.settings.resultSymbolMatrix = matrix;

    }
    getRandomIndex(maxValue: number): number {
        return Math.floor(Math.random() * (maxValue + 1));
    }

}

