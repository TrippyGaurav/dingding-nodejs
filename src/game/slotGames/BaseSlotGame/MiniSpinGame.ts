
const getRandomIndex = (probArray: number[]): number => {
  const totalProb = probArray.reduce((sum, prob) => sum + prob, 0);
  const rand = Math.random() * totalProb;
  let sum = 0;
  for (let i = 0; i < probArray.length; i++) {
    sum += probArray[i];
    if (rand < sum) return i;
  }
  return probArray.length - 1;
  // Fallback to last index if something goes wrong
};

const getRandomSymbol = (symbols: number[], probArray: number[]): number => {
  const index = getRandomIndex(probArray);
  return symbols[index];
};

const generateInnerMatrix = (symbols: number[], miniSlotProb: number[]): number[] => {
  return Array.from({ length: 3 }, () => getRandomSymbol(symbols, miniSlotProb));
};





export function runMiniSpin(bonus: any): any {
  try {
    if (bonus.noOfItem < 3) return ;

    let lives = bonus.noOfItem > 5 ? 3 : bonus.noOfItem - 2;
    let totalWinAmount = 0;
    const { symbols, miniSlotProb, outerRingProb, payout } = bonus;

    let result = {
      innerMatrix: [],
      outerRingSymbol: [],
      totalWinAmount: 0
    }

    console.log(`Lives: ${lives}`);

    while (lives > 0) {
      const innerMatrix = generateInnerMatrix(symbols, miniSlotProb);
      const outerRingSymbol = getRandomSymbol(symbols, outerRingProb);
      const matchCount = innerMatrix.filter(symbol => symbol === outerRingSymbol).length;
      result.innerMatrix.push(innerMatrix);
      result.outerRingSymbol.push(outerRingSymbol);
      result.totalWinAmount += payout[outerRingSymbol] * matchCount;

      totalWinAmount += payout[outerRingSymbol] * matchCount;


      if (outerRingSymbol === 7) {
        lives--;
      }

      console.log(`Inner Matrix: ${innerMatrix.join(', ')}`);
      console.log(`Outer Ring: ${outerRingSymbol}`);
      console.log(`Matches: ${matchCount}, Win: ${payout[outerRingSymbol] * matchCount}`);
      console.log(`Lives remaining: ${lives}`);
    }

    console.log(`${JSON.stringify(result)}`);

    return result;
  } catch (e) {
    console.log(e);
  }

}
