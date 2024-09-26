export const gameData = [
  {
     "id": "SL-WOF",
     "isSpecial": true,
     "matrix": {
        "x": 3,
        "y": 3
     },
     "bonus": {
        "type": "spin",
        "isEnabled": true,
        "noOfItem": 8,
        "payOut": [
           1000,
           100,
           70,
           50,
           30,
           20,
           10,
           5,
           200,
           100,
           70,
           50,
           30,
           20,
           10,
           0,
           200,
           100,
           70,
           50,
           30,
           20,
           10,
           0
        ],
     "payOutProb": [0.000168, 0.16843, 0.33685, 1.01056, 3.36853, 6.73707, 8.42134, 13.28887, 0.00168, 0.16843, 0.33685, 1.01056, 3.36853, 6.73707, 8.42134, 13.28887, 0.00168, 0.16843, 0.33685, 1.01056, 3.36853, 6.73707, 8.42134, 13.28887]
     },
     "linesApiData": [
        [0, 0, 0],
        [1, 1, 1],
        [2, 2, 2]
     ],
     "linesCount": [3],
     "bets": [0.01, 0.02, 0.05, 0.075,  0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5],
     "Symbols": [
        {
           "Name": "Blank",
           "Id": 0,
           "payout": 0,
           "mixedPayout": 0,
           "isSpecialWof": false,
           "canmatch": [],
           "reelInstance": {
              "0": 60,
              "1": 60,
              "2": 60
           }
        },
        {
           "Name": "777",
           "Id": 1,
           "payout": 100,
           "mixedPayout": 10,
           "isSpecialWof": false,
           "canmatch": ["1", "2", "3", "6", "7", "8", "11"],
           "reelInstance": {
              "0": 2,
              "1": 2,
              "2": 2
           }
        },
        {
           "Name": "77",
           "Id": 2,
           "payout": 50,
           "mixedPayout": 10,
           "isSpecialWof": false,
           "canmatch": ["1", "2", "3", "6", "7", "8", "11"],
           "reelInstance": {
              "0": 4,
              "1": 4,
              "2": 4
           }
        },
        {
           "Name": "7",
           "Id": 3,
           "payout": 25,
           "mixedPayout": 10,
           "isSpecialWof": false,
           "canmatch": ["1", "2", "3", "6", "7", "8", "11"],
           "reelInstance": {
              "0": 7,
              "1": 7,
              "2": 7
           }
        },
        {
           "Name": "5_bar",
           "Id": 4,
           "payout": 40,
           "mixedPayout": 5,
           "isSpecialWof": false,
           "canmatch": ["4", "5", "9", "10"],
           "reelInstance": {
              "0": 10,
              "1": 10,
              "2": 10
           }
        },
        {
           "Name": "bar",
           "Id": 5,
           "payout": 30,
           "mixedPayout": 5,
           "isSpecialWof": false,
           "canmatch": ["4", "5", "9", "10"],
           "reelInstance": {
              "0": 12,
              "1": 12,
              "2": 12
           }
        },
        {
           "Name": "777T",
           "Id": 6,
           "payout": 1000,
           "mixedPayout": 10,
           "isSpecialWof": true,
           "canmatch": ["1", "2", "3", "6", "7", "8", "11"],
           "reelInstance": {
              "0": 1,
              "1": 1,
              "2": 1
           }
        },
        {
           "Name": "77T",
           "Id": 7,
           "payout": 200,
           "mixedPayout": 10,
           "isSpecialWof": true,
           "canmatch": ["1", "2", "3", "6", "7", "8", "11"],
           "reelInstance": {
              "0": 2,
              "1": 2,
              "2": 2
           }
        },
        {
           "Name": "7T",
           "Id": 8,
           "payout": 50,
           "mixedPayout": 10,
           "isSpecialWof": true,
           "canmatch": ["1", "2", "3", "6", "7", "8", "11"],
           "reelInstance": {
              "0": 2,
              "1": 2,
              "2": 2
           }
        },
        {
           "Name": "5_barT",
           "Id": 9,
           "payout": 40,
           "mixedPayout": 5,
           "isSpecialWof": true,
           "canmatch": ["4", "5", "9", "10"],
           "reelInstance": {
              "0": 4,
              "1": 4,
              "2": 4
           }
        },
        {
           "Name": "barT",
           "Id": 10,
           "payout": 30,
           "mixedPayout": 5,
           "isSpecialWof": true,
           "canmatch": ["4", "5", "9", "10"],
           "reelInstance": {
              "0": 5,
              "1": 5,
              "2": 5
           }
        },
        {
           "Name": "WOF777",
           "Id": 11,
           "payout": 1000,
           "mixedPayout": 0,
           "isSpecialWof": true,
           "canmatch": ["1", "2", "3", "6", "7", "8", "11"],
           "reelInstance": {
              "0": 1,
              "1": 1,
              "2": 1
           }
        },
        {
           "Name": "Bonus",
           "Id": 12,
           "payout": 0,
           "mixedPayout": 0,
           "symbolsCount": 2,
           "canmatch": [],
           "reelInstance": {
              "0": 4,
              "1": 4,
              "2": 4
           }
        }
     ],
     "defaultPayout": 3
  }]