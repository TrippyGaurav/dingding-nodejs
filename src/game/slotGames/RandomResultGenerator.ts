import SlotGame from "./slotGame";

export class RandomResultGenerator {
    currentGame: SlotGame;

    constructor(current) {
        let matrix: string[][] = [];
        let randomIndexArray: number[] = [];
        for (let j = 0; j < current.settings.matrix.y; j++) {
            let row: string[] = [];
            for (let i = 0; i < current.settings.matrix.x; i++) {
                if (j == 0) {
                    let rowrandomIndex =
                        Math.floor(Math.random() * (current.settings.reels[i].length - 1 - 0)) +
                        0;
                    randomIndexArray.push(rowrandomIndex);
                    row.push(current.settings.reels[i][rowrandomIndex].toString());
                } else {
                    let initialRandomIndex = randomIndexArray[i];
                    let adjustedIndex = (initialRandomIndex + j) % current.settings.reels[i].length;
                    row.push(current.settings.reels[i][adjustedIndex].toString());
                }
            }
            matrix.push(row);

        }
        current.settings.resultReelIndex = randomIndexArray;
        console.log("indexs", randomIndexArray);
        console.log("gameSettings._winData.resultReelIndex", current.settings.resultReelIndex);

        matrix.pop();
        matrix.pop();
        matrix.pop();


        matrix.push(['0', '13', '13', '13', '4'])
        matrix.push(['5', '11', '2', '12', '4'])
        matrix.push(['2', '13', '5', '7', '2'])



        current.settings.resultSymbolMatrix = matrix;
        // console.log("MATRIX " + matrix);

    }
    // Function to generate a random number based on weights
    randomWeightedIndex(weights: number[]): number {
        const totalWeight: number = weights.reduce((acc, val) => acc + val, 0);
        const randomNumber: number = Math.random() * totalWeight;
        let weightSum: number = 0;
        for (let i = 0; i < weights.length; i++) {
            weightSum += weights[i];
            if (randomNumber <= weightSum) {
                return i;
            }
        }
        // Default to last index if not found
        return weights.length - 1;
    }
}