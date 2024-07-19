import { middleware } from "../../utils/middleware";
import { GData } from "../Global.";
import { slotGameSettings } from "./_global";
import { bonusGame } from "./extraBonusGames";
import { RandomResultGenerator } from "./slotDataInit";
import { CheckResult } from "./slotResults";
import { bonusGameType, ResultType, specialIcons, WeightedItem } from "./slotTypes";


export function addPayLineSymbols(
  symbol: string,
  repetition: number,
  pay: number,
  freeSpins: number
): void {
  const line: string[] = Array(repetition).fill(symbol); // Create an array with 'repetition' number of 'symbol'

  if (line.length != slotGameSettings.matrix.x) {
    let lengthToAdd = slotGameSettings.matrix.x - line.length;
    for (let i = 0; i < lengthToAdd; i++) line.push("any");
  }

  slotGameSettings.payLine.push({
    line: line,
    pay: pay,
    freeSpins: freeSpins,
  });
}

export function makePayLines() {
  slotGameSettings.currentGamedata.Symbols.forEach((element) => {
    if (element.useWildSub || (element.Name == "FreeSpin") || (element.Name == "Scatter")) {
      element.multiplier?.forEach((item, index) => {
        addPayLineSymbols(element.Id?.toString(), 5 - index, item[0], item[1]);
      });
    } else {
      handleSpecialSymbols(element);
    }
  });
}

function handleSpecialSymbols(symbol) {
  slotGameSettings.bonusPayTable = [];
  slotGameSettings.scatterPayTable = [];

  switch (symbol.Name) {
    case specialIcons.jackpot:
      slotGameSettings.jackpot.symbolName = symbol.Name;
      slotGameSettings.jackpot.symbolId = symbol.Id;
      slotGameSettings.jackpot.symbolsCount = symbol.symbolsCount;
      slotGameSettings.jackpot.defaultAmount = symbol.defaultAmount;
      slotGameSettings.jackpot.increaseValue = symbol.increaseValue;
      break;
    case specialIcons.wild:
      slotGameSettings.wildSymbol.SymbolName = symbol.Name;
      slotGameSettings.wildSymbol.SymbolID = symbol.Id;
      slotGameSettings.useWild = true;
      break;
    case specialIcons.scatter:
      slotGameSettings.scatterPayTable.push({
        symbolCount: symbol.count,
        symbolID: symbol.Id,
        pay: symbol.pay,
        freeSpins: symbol.freeSpin,
      });
      slotGameSettings.useScatter = true;
      break;
    case specialIcons.bonus:
      slotGameSettings.bonusPayTable.push({
        symbolCount: symbol.symbolCount,
        symbolID: symbol.Id,
        pay: symbol.pay,
        highestPayMultiplier: symbol.highestMultiplier,
      });
      break;
    default:
      break;
  }
}

//CHECKMOOLAH
export function spinResult(clientID: string) {
  // console.log(gameSettings._winData, ":gameSettings._winData");

  if (
    slotGameSettings.currentGamedata.bonus.isEnabled &&
    slotGameSettings.currentGamedata.bonus.type == bonusGameType.tap
  )
    slotGameSettings.bonus.game = new bonusGame(
      slotGameSettings.currentGamedata.bonus.noOfItem,
      clientID
    );


  GData.playerSocket.deductPlayerBalance(slotGameSettings.currentBet);
  // TODO : Middle ware goes here
  (async () => {
    await middleware();
  })();

  slotGameSettings.tempReels = [[]];
  slotGameSettings.bonus.start = false;

  new RandomResultGenerator();
  const result = new CheckResult();
  result.makeResultJson(ResultType.normal);
}

export function startFreeSpin() {
  console.log(
    "____----Started FREE SPIN ----_____" + " :::  FREE SPINSS ::::",
    slotGameSettings._winData.freeSpins
  );
  GData.playerSocket.sendMessage("StartedFreeSpin", {});
  slotGameSettings.freeSpinStarted = true;
  for (let i = 0; i <= slotGameSettings._winData.freeSpins; i++) {
    slotGameSettings.bonus.start = false;
    new RandomResultGenerator();
    new CheckResult();
    console.log(
      "FREE SPINS LEFTTT ::::" + (slotGameSettings._winData.freeSpins - i)
    );
  }
  slotGameSettings._winData.freeSpins = 0;

  GData.playerSocket.sendMessage("StoppedFreeSpins", {});
  slotGameSettings.freeSpinStarted = false;

  console.log("____----Stopped FREE SPIN ----_____");
}
export function checkforMoolah() {
  console.log("_______-------CALLED FOR CHECK FOR MOOLAHHHH-------_______");


  slotGameSettings.tempReels = slotGameSettings.reels;
  const lastWinData = slotGameSettings._winData;
  lastWinData.winningSymbols = combineUniqueSymbols(
    removeRecurringIndexSymbols(lastWinData.winningSymbols)
  );
  const index = lastWinData.winningSymbols.map((str) => {
    const index: { x, y } = str.split(",").map(Number);
    return index;
  });
  console.log("Winning Indexes " + index);
  let matrix = [];
  matrix = slotGameSettings.resultSymbolMatrix;
  index.forEach(element => {
    matrix[element[1]][element[0]] = null;

  })
  const movedArray = cascadeMoveTowardsNull(matrix);

  let transposed = transposeMatrix(movedArray);
  let iconsToFill: number[][] = []
  for (let i = 0; i < transposed.length; i++) {
    let row = []
    for (let j = 0; j < transposed[i].length; j++) {
      if (transposed[i][j] == null) {
        let index = (slotGameSettings.resultReelIndex[i] + j + 2) % slotGameSettings.tempReels[i].length;
        transposed[i][j] = slotGameSettings.tempReels[i][index];
        row.unshift(slotGameSettings.tempReels[i][index]);
      }

    }
    if (row.length > 0)
      iconsToFill.push(row);
  }


  matrix = transposeMatrix(transposed);
  // matrix.pop();
  // matrix.pop();
  // matrix.pop();
  // matrix.push([ '1', '2', '3', '4', '5' ])
  // matrix.push([ '1', '1', '1', '1', '6' ])
  // matrix.push([ '0', '0', '0', '0', '0' ])
  console.log("iconsTofill", iconsToFill);
  slotGameSettings.resultSymbolMatrix = matrix;

  const result = new CheckResult();
  result.makeResultJson(ResultType.moolah, iconsToFill);
}

function getLastindex(reelIndex: number, index: number) {
  if (index >= slotGameSettings.tempReels[reelIndex].length)
    if (index >= slotGameSettings.tempReels[reelIndex].length)
      index = index - slotGameSettings.tempReels[reelIndex].length;

  console.log("index __", index);


  let Index = index - 1;
  console.log("Changed Index " + Index);
  if (Index < 0) {
    Index = slotGameSettings.tempReels[reelIndex].length - 1;
    console.log("Reel Lenght " + slotGameSettings.tempReels[reelIndex].length + " Changed value below Zeros " + Index);
    return slotGameSettings.tempReels[reelIndex][Index]
  }
  else return slotGameSettings.tempReels[reelIndex][Index];
}


function cascadeMoveTowardsNull(arr: (string | null)[][]): (string | null)[][] {
  if (arr.length === 0 || arr[0].length === 0) return arr;
  const numRows = arr.length;
  const numCols = arr[0].length;

  let result: (string | null)[][] = Array.from({ length: numRows }, () => new Array(numCols).fill(null));

  for (let col = 0; col < numCols; col++) {
    let newRow = numRows - 1;

    // Place non-null elements starting from the bottom
    for (let row = numRows - 1; row >= 0; row--) {
      if (arr[row][col] !== null) {
        result[newRow][col] = arr[row][col];
        newRow--;
      }
    }

    // Fill the top positions with null if there are remaining positions
    for (let row = newRow; row >= 0; row--) {
      result[row][col] = null;
    }
  }

  return result;
}

function transposeMatrix(matrix) {
  let transposed = [];

  for (let i = 0; i < matrix[0].length; i++) {
    let newRow = [];
    for (let j = 0; j < matrix.length; j++) {
      newRow.push(matrix[j][i]);
    }
    transposed.push(newRow);
  }

  return transposed;

}




export function weightedRandom<T>(
  items: T[],
  weights: number[]
): WeightedItem<T> {
  if (items.length !== weights.length) {
    throw new Error("Items and weights must be of the same size");
  }
  if (!items.length) {
    throw new Error("Items must not be empty");
  }
  // Preparing the cumulative weights array.
  const cumulativeWeights: number[] = [];
  for (let i = 0; i < weights.length; i += 1) {
    cumulativeWeights[i] = weights[i] + (cumulativeWeights[i - 1] || 0);
  }
  // Getting the random number in a range of [0...sum(weights)]
  const maxCumulativeWeight = cumulativeWeights[cumulativeWeights.length - 1];
  const randomNumber = maxCumulativeWeight * Math.random();
  // Picking the random item based on its weight.
  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    if (cumulativeWeights[itemIndex] >= randomNumber) {
      return {
        item: items[itemIndex],
        index: itemIndex,
      };
    }
  }
  // This should not happen if the weights are correctly defined,
  // but if we get here, return the last item.
  return {
    item: items[items.length - 1],
    index: items.length - 1,
  };
}

// Function to generate a 5x18 matrix of randomly selected items based on weights
export function generateMatrix(n_Rows: number, n_Columns: number): any[][] {
  const matrix: any[][] = [];
  for (let i = 0; i < n_Rows; i++) {
    const row: any[] = [];
    for (let j = 0; j < n_Columns; j++) {
      const result = weightedRandom(slotGameSettings.Symbols, slotGameSettings.Weights);
      row.push(result.item);
    }
    matrix.push(row);
  }
  // console.log(matrix);
  return matrix;
}

export function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let k = array[i];
    array[i] = array[j];
    array[j] = k;
  }
}

export function convertData(data: string[][]): string[] {
  const result: string[] = [];
  for (const row of data) {
    const convertedRow = Array.from(Array(row.length + 1).keys()).join(",");
    result.push(`"${convertedRow}"`);
  }
  return result;
}

export function convertSymbols(data) {
  let uiData = {
    symbols: [],
  };
  if (!Array.isArray(data)) {
    console.error("Input data is not an array");
    return uiData;
  }
  data.forEach((element) => {
    let symbolData = {
      ID: element.Id,
      Name: element.Name || {},
      multiplier: element.multiplier || {},
      defaultAmount: element.defaultAmount || {},
      symbolsCount: element.symbolsCount || element.symbolCount || {},
      increaseValue: element.increaseValue || {},
      freeSpin: element.freeSpin
    };
    // if (element.multiplier) {
    //   const multiplierObject = {};
    //   element.multiplier.forEach((item, index) => {
    //     multiplierObject[(5 - index).toString() + "x"] = item[0];
    //   });
    //   symbolData.multiplier = multiplierObject;
    // }
    uiData.symbols.push(symbolData);
  });

  return uiData;
}
export function removeRecurringIndexSymbols(
  symbolsToEmit: string[][]
): string[][] {
  const seen = new Set<string>();
  const result: string[][] = [];

  symbolsToEmit.forEach((subArray) => {
    if (!Array.isArray(subArray)) {
      console.warn('Expected an array but got', subArray);
      return;
    }
    const uniqueSubArray: string[] = [];
    subArray.forEach((symbol) => {
      if (!seen.has(symbol)) {
        seen.add(symbol);
        uniqueSubArray.push(symbol);
      }
    });
    if (uniqueSubArray.length > 0) {
      result.push(uniqueSubArray);
    }
  });

  return result;
}
export function combineUniqueSymbols(symbolsToEmit: string[][]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  symbolsToEmit.forEach((subArray) => {
    subArray.forEach((symbol) => {
      if (!seen.has(symbol)) {
        seen.add(symbol);
        result.push(symbol);
      }
    });
  });

  return result;
}

// Test the function
