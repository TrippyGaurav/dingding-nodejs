"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomResultGenerator = void 0;
class RandomResultGenerator {
    constructor(current) {
        let matrix = [];
        let randomIndexArray = [];
        for (let j = 0; j < current.settings.matrix.y; j++) {
            let row = [];
            for (let i = 0; i < current.settings.matrix.x; i++) {
                if (j == 0) {
                    let rowrandomIndex = Math.floor(Math.random() * (current.settings.reels[i].length - 1 - 0)) +
                        0;
                    randomIndexArray.push(rowrandomIndex);
                    row.push(current.settings.reels[i][rowrandomIndex].toString());
                }
                else {
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
        // matrix.pop();
        // matrix.pop();
        // matrix.pop();
        // matrix.push(['1', '2', '3', '4', '5'])
        // matrix.push(['2', '13', '13', '13', '13'])
        // matrix.push(['1', '0', '1', '2', '6'])
        current.settings.resultSymbolMatrix = matrix;
        // console.log("MATRIX " + matrix);
    }
    // Function to generate a random number based on weights
    randomWeightedIndex(weights) {
        const totalWeight = weights.reduce((acc, val) => acc + val, 0);
        const randomNumber = Math.random() * totalWeight;
        let weightSum = 0;
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
exports.RandomResultGenerator = RandomResultGenerator;
