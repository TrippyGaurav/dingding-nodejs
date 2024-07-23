import { randomInt } from "crypto"; // For random number generation
import { kenoCurrentGameData } from "./_global";
import { GData } from "../Global";

interface PayoutTable {
    [key: number]: { [key: number]: number };
}

export const defaultPayoutTable: PayoutTable = {
    1: { 0: 0, 1: 0 },
    2: { 0: 0, 1: 1, 2: 8 },
    3: { 0: 0, 1: 1, 2: 2, 3: 20 },
    4: { 0: 0, 1: 0.5, 2: 2, 3: 5, 4: 40 },
    5: { 0: 0, 1: 0.5, 2: 1, 3: 3, 4: 10, 5: 200 },
    6: { 0: 0, 1: 0, 2: 0.5, 3: 2, 4: 12, 5: 55, 6: 300 },
    7: { 0: 0, 1: 0, 2: 0.5, 3: 1, 4: 5, 5: 15, 6: 300, 7: 1000 },
    8: { 0: 0, 1: 0, 2: 0.5, 3: 1, 4: 3, 5: 5, 6: 50, 7: 500, 8: 3000 },
    9: { 0: 0, 1: 0, 2: 0.2, 3: 0.5, 4: 1, 5: 5, 6: 20, 7: 100, 8: 500, 9: 4000 },
    10: { 0: 0, 1: 0, 2: 0.25, 3: 0.5, 4: 1, 5: 2.5, 6: 10, 7: 40, 8: 100, 9: 500, 10: 5000 }
};

const totalNumbers: number[] = Array.from({ length: 80 }, (_, i) => i + 1);

function selectNumbers(count: number): number[] {
    if (count < 1 || count > 10) {
        throw new Error("You must select between 1 and 10 numbers.");
    }
    const shuffledNumbers = [...totalNumbers].sort(() => Math.random() - 0.5);
    return shuffledNumbers.slice(0, count);
}

function drawNumbers(): number[] {
    return Array.from({ length: 20 }, () => totalNumbers[randomInt(0, 80)]);
}

function calculateWinnings(selectedNumbers: number[], drawnNumbers: number[], payoutTable: PayoutTable): number {
    const matches = selectedNumbers.filter(num => drawnNumbers.includes(num)).length;
    const betSize = selectedNumbers.length;
    return payoutTable[betSize]?.[matches] || 0;
}

export function play(count: number, payoutTable: PayoutTable = defaultPayoutTable): void {
    let totalWinnings = 0;
    const matchCounts: { [key: number]: number } = {};

    for (let i = 0; i <= count; i++) {
        matchCounts[i] = 0;
    }
    GData.playerSocket.deductPlayerBalance(kenoCurrentGameData.currentBet);
    const selectedNumbers = kenoCurrentGameData.currentSelectedNumbers;
    const drawnNumbers = drawNumbers();
    const winnings = calculateWinnings(selectedNumbers, drawnNumbers, payoutTable);
    totalWinnings += winnings;
    GData.playerSocket.updatePlayerBalance(totalWinnings);
    const matches = selectedNumbers.filter(num => drawnNumbers.includes(num)).length;
    matchCounts[matches] += 1;



    // const rtp = totalWinnings / spins;

    // console.log(`Total spins: ${spins}`);
    // for (let i = 0; i <= count; i++) {
    //     if (i in matchCounts) {
    //         console.log(`Matches ${i}: ${matchCounts[i]}`);
    //     }
    // }
    // console.log(`Total winnings: ${totalWinnings}`);
    // console.log(`RTP (Return to Player): ${rtp.toFixed(6)}`);
}

function sendResult() {

}
// play(10000, 10);
