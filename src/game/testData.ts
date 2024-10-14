export const gameData = [
  {
    "id": "SL-LOL",
    "matrix": {
      "x": 5,
      "y": 3
    },
    "linesCount": [
      1,
      5,
      15,
      20
    ],
    "bets": [
      0.1,
      0.25,
      0.5,
      0.75,
      1
    ],
    "gamble": {
      "type": "card",
      "isEnabled": false
    },
    "Symbols": [
      {
        "Name": "Jet",
        "Id": 0,
        "isSpecial": false,
        "reelInstance": { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2 },
        "payout": [1000, 500, 100],
      },
      {
        "Name": "Yacht",
        "Id": 1,
        "isSpecial": false,
        "reelInstance": { 0: 3, 1: 3, 2: 3, 3: 3, 4: 3 },
        "payout": [500, 250, 50],
      },
      {
        "Name": "Sportscar",
        "Id": 2,
        "isSpecial": false,
        "reelInstance": { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4 },
        "payout": [250, 100, 25],
      },
      {
        "Name": "Diamond",
        "Id": 3,
        "isSpecial": false,
        "reelInstance": { 0: 5, 1: 5, 2: 5, 3: 5, 4: 5 },
        "payout": [100, 50, 10],
      },
      {
        "Name": "Gold Bar",
        "Id": 4,
        "isSpecial": false,
        "reelInstance": { 0: 6, 1: 6, 2: 6, 3: 6, 4: 6 },
        "payout": [50, 25, 5],
      },
      {
        "Name": "Champagne",
        "Id": 5,
        "isSpecial": false,
        "reelInstance": { 0: 7, 1: 7, 2: 7, 3: 7, 4: 7 },
        "payout": [25, 10, 3],
      },
      {
        "Name": "Wild",
        "Id": 6,
        "isSpecial": true,
        "reelInstance": { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1 },
        "payout": [2000, 1000, 200],
      },
    ]
  }
  // {
  //   "id": "SL-ONE",
  //   "isSpecial": true,
  //   "matrix": {
  //     "x": 1,
  //     "y": 1
  //   },
  //   "bets": [
  //     1,
  //     2,
  //     3,
  //     4,
  //     5
  //   ],
  //
  //   "linesApiData": [],
  //   "scatterPurple": {
  //     "isEnabled": true,
  //     "topSymbolProbs": [0, 140, 130, 120, 120, 110, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  //     //make sure special symbols and empty have 0
  //     "symbolsProbs": [5, 140, 130, 120, 120, 110, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // probability of each symbol
  //     //make sure special symbols have 0
  //     "featureProbs": [0, 40, 40, 40] // probability of each feature . index : 0 - no feature, 1 - level up, 2 - booster ,3 - both levelup and booster
  //   },
  //   "scatterBlue": {
  //     "isEnabled": true,
  //     "symbolsProbs": [250, 14, 13, 12, 12, 11, 11, 11, 11, 9, 9, 8, 5, 2, 0, 0, 0], // probability of each symbol
  //     "featureProbs": [0, 40, 40, 40] // probability of each feature . index : 0 - no feature, 1 - level up, 2 - booster ,3 - both levelup and booster
  //   },
  //   "booster": {
  //     "isEnabledSimple": true,
  //     "isEnabledExhaustive": true,
  //     "type": "",
  //     "typeProbs": [10, 15, 15], // index : 0 - no booster, 1 - simple booster, 2 - exhaustive booster
  //     "multiplier": [1, 2, 3, 5, 10, 15, 20, 25],// multiplier amt
  //     "multiplierProbs": [90, 70, 40, 20, 10, 4, 3, 1], // multiplier probability
  //   },
  //   "levelUp": {
  //     "isEnabled": true,
  //     "level": [0, 1, 2, 3, 4, 5, 6, 7],//increment symbol amounts . 0 - no level up
  //     "levelProbs": [6, 50, 40, 30, 20, 15, 14, 12],// increment symbol probability 
  //   },
  //   "joker": {
  //     "isEnabled": true,
  //     "payout":[50,500,5000],
  //     "blueRound": [8, 70, 60, 150],// 0 - no matches , 1 - only one match ...
  //     "greenRound": [8, 70, 60, 150],// 0 - no matches , 1 - only one match ...
  //     "redRound": [8, 70, 60, 50],// 0 - no matches , 1 - only one match ...
  //     // "blueRound": [100, 1, 100, 1, 100, 1, 100, 1, 100, 1, 100, 10], // all even including 0 is joker - 0,2,4,6,8,10
  //     // "greenRound": [100, 1, 1, 100, 1, 1, 100, 1, 1, 100, 1, 1],//all numbers divisible by 3 including 0 is joker - 0,3,6,9
  //     // "redRound": [100, 1, 1, 1, 1, 100, 1, 1, 1, 1, 100, 10],//all numbers divisible by 5 including 0 is joker - 0,5,10
  //
  //   },
  //   // bonus: {
  //   //   isEnabled: true,
  //   //   type: "",
  //   //   noOfItem: 0,
  //   //   payOut: [], // Ensure payOut is initialized
  //   //   payOutProb: [], // Ensure payOutProb is initialized
  //   //   payTable: [], // Ensure payTable is initialized
  //   // },
  //   "Symbols": [
  //     {
  //       //empty
  //       "Name": "empty",
  //       "Id": 0,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 9,
  //         "1": 9,
  //         "2": 9,
  //         "3": 9,
  //         "4": 9
  //       },
  //       "freeSpinCount": 0,
  //       "payout": 0,
  //     },
  //     {
  //       //banana
  //       "Name": "banana",
  //       "Id": 1,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 9,
  //         "1": 9,
  //         "2": 9,
  //         "3": 9,
  //         "4": 9
  //       },
  //       "freeSpinCount": 1,
  //       "payout": 1,
  //     },
  //     {
  //       //watermelon
  //       "Name": "watermelon",
  //       "Id": 2,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 9,
  //         "1": 9,
  //         "2": 9,
  //         "3": 9,
  //         "4": 9
  //       },
  //       "freeSpinCount": 1,
  //       "payout": 1,
  //     },
  //     {
  //       //cherry
  //       "Name": "cherry",
  //       "Id": 3,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 9,
  //         "1": 9,
  //         "2": 9,
  //         "3": 9,
  //         "4": 9
  //       },
  //       "freeSpinCount": 1,
  //       "payout": 2,
  //     },
  //     {
  //       //grapes
  //       "Name": "grapes",
  //       "Id": 4,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 9,
  //         "1": 9,
  //         "2": 9,
  //         "3": 9,
  //         "4": 9
  //       },
  //       "freeSpinCount": 1,
  //       "payout": 2,
  //     },
  //     {
  //       //lemon
  //       "Name": "lemon",
  //       "Id": 5,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 4,
  //         "1": 4,
  //         "2": 4,
  //         "3": 4,
  //         "4": 4
  //       },
  //       "freeSpinCount": 1,
  //       "payout": 2,
  //     },
  //     {
  //       //orange
  //       "Name": "orange",
  //       "Id": 6,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 4,
  //         "1": 4,
  //         "2": 4,
  //         "3": 4,
  //         "4": 4
  //       },
  //       "freeSpinCount": 1,
  //       "payout": 4,
  //     },
  //     {
  //       //bell
  //       "Name": "bell",
  //       "Id": 7,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 4,
  //         "1": 4,
  //         "2": 4,
  //         "3": 4,
  //         "4": 4
  //       },
  //       "freeSpinCount": 2,
  //       "payout": 5,
  //     },
  //     {
  //       //bar
  //       "Name": "bar",
  //       "Id": 8,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 4,
  //         "1": 4,
  //         "2": 4,
  //         "3": 4,
  //         "4": 4
  //       },
  //       "payout": 10,
  //       "freeSpinCount": 2,
  //     },
  //     {
  //       //7
  //       "Name": "7",
  //       "Id": 9,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 4,
  //         "1": 4,
  //         "2": 4,
  //         "3": 4,
  //         "4": 4
  //       },
  //       "payout": 15,
  //       "freeSpinCount": 2,
  //     },
  //
  //     {
  //       //double bar
  //       "Name": "doubleBar",
  //       "Id": 10,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 4,
  //         "1": 4,
  //         "2": 4,
  //         "3": 4,
  //         "4": 4
  //       },
  //       "freeSpinCount": 2,
  //       "payout": 20,
  //     },
  //     {
  //       //double 7
  //       "Name": "double7",
  //       "Id": 11,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 4,
  //         "1": 4,
  //         "2": 4,
  //         "3": 4,
  //         "4": 4
  //       },
  //       "freeSpinCount": 2,
  //       "payout": 30,
  //     },
  //
  //     {
  //       //triple bar
  //       "Name": "tripleBar",
  //       "Id": 12,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 4,
  //         "1": 4,
  //         "2": 4,
  //         "3": 4,
  //         "4": 4
  //       },
  //       "freeSpinCount": 0,
  //       "payout": 50,
  //     },
  //
  //     {
  //       //triple 7
  //       "Name": "triple7",
  //       "Id": 13,
  //       "isSpecial": false,
  //       "reelInstance": {
  //         "0": 4,
  //         "1": 4,
  //         "2": 4,
  //         "3": 4,
  //         "4": 4
  //       },
  //       "freeSpinCount": 0,
  //       "payout": 200,
  //     },
  //     {
  //       "Name": "ScatterBlue",
  //       "Id": 14,
  //       "isSpecial": true,
  //       "reelInstance": {
  //         "0": 1,
  //         "1": 1,
  //         "2": 1,
  //         "3": 1,
  //         "4": 1
  //       },
  //       "description": "Scatter: Respin free games",
  //       "freeSpinCount": 0,
  //       "payout": 0,
  //     },
  //     {
  //       "Name": "ScatterPurple",
  //       "Id": 15,
  //       "isSpecial": true,
  //       "reelInstance": {
  //         "0": 2,
  //         "1": 2,
  //         "2": 2,
  //         "3": 2,
  //         "4": 2
  //       },
  //       "description": "Scatter: fruit free games",
  //       "freeSpinCount": 0,
  //       "payout": 0,
  //     },
  //
  //     {
  //       "Name": "Joker",
  //       "Id": 16,
  //       "isSpecial": true,
  //       "reelInstance": {
  //         "0": 62,
  //         "1": 62,
  //         "2": 62,
  //         "3": 62,
  //         "4": 62
  //       },
  //       "description": "Joker",
  //       "freeSpinCount": 0,
  //       "payout": 0,
  //     },
  //   ]
  // }
  // {
  //    "id":"SL-VIK",
  //    "matrix":{
  //       "x":5,
  //       "y":3
  //    },
  //    "linesApiData":[
  //       [
  //          1,
  //          1,
  //          1,
  //          1,
  //          1
  //       ],
  //       [
  //          0,
  //          0,
  //          0,
  //          0,
  //          0
  //       ],
  //       [
  //          2,
  //          2,
  //          2,
  //          2,
  //          2
  //       ],
  //       [
  //          0,
  //          1,
  //          2,
  //          1,
  //          0
  //       ],
  //       [
  //          2,
  //          1,
  //          0,
  //          1,
  //          2
  //       ],
  //       [
  //          1,
  //          0,
  //          1,
  //          0,
  //          1
  //       ],
  //       [
  //          1,
  //          2,
  //          1,
  //          2,
  //          1
  //       ],
  //       [
  //          0,
  //          0,
  //          1,
  //          2,
  //          2
  //       ],
  //       [
  //          2,
  //          2,
  //          1,
  //          0,
  //          0
  //       ],
  //       [
  //          1,
  //          2,
  //          1,
  //          0,
  //          1
  //       ],
  //       [
  //          1,
  //          0,
  //          1,
  //          2,
  //          1
  //       ],
  //       [
  //          0,
  //          1,
  //          1,
  //          1,
  //          0
  //       ],
  //       [
  //          2,
  //          1,
  //          1,
  //          1,
  //          2
  //       ],
  //       [
  //          0,
  //          1,
  //          0,
  //          1,
  //          0
  //       ],
  //       [
  //          2,
  //          1,
  //          2,
  //          1,
  //          2
  //       ],
  //       [
  //          1,
  //          1,
  //          0,
  //          1,
  //          1
  //       ],
  //       [
  //          1,
  //          1,
  //          2,
  //          1,
  //          1
  //       ],
  //       [
  //          0,
  //          0,
  //          1,
  //          0,
  //          0
  //       ],
  //       [
  //          2,
  //          2,
  //          0,
  //          2,
  //          2
  //       ],
  //       [
  //          0,
  //          2,
  //          2,
  //          2,
  //          0
  //       ]
  //    ],
  //    "linesCount":[
  //       1,
  //       5,
  //       15,
  //       20
  //    ],
  //    "bets":[
  //       0.1,
  //       0.25,
  //       0.5,
  //       0.75,
  //       1
  //    ],
  //         "bonus":{
  //            "type":"miniSpin",
  //            "isEnabled":true,
  //            "noOfItem":8,
  //             "symbols":[  0, 1, 2, 3, 4, 5, 6, 7  ], //numbers [] symbol ids , 7 for exit
  //             "miniSlotProb":[ 0.5, 1, 3, 10, 20, 25, 39.4 , 0],
  //             "outerRingProb":[  0.5, 1, 3, 10, 20, 25, 39.4, 10],
  //             "payout":[ 100, 70, 50, 20, 10, 5, 2, 0]
  //         },
  //    // "bonus":{
  //    //    "type":"spin",
  //    //    "isEnabled":true,
  //    //    "noOfItem":8,
  //    //    "payOut":[
  //    //       200,
  //    //       100,
  //    //       70,
  //    //       50,
  //    //       30,
  //    //       20,
  //    //       10,
  //    //       5
  //    //    ],
  //    //    "payOutProb":[
  //    //       0.05,
  //    //       0.5,
  //    //       1,
  //    //       3,
  //    //       10,
  //    //       20,
  //    //       25,
  //    //       39.4
  //    //    ]
  //    // },
  //    "gamble":{
  //       "type":"card",
  //       "isEnabled":false
  //    },
  //    "Symbols":[
  //       {
  //          "Name":"0",
  //          "Id":0,
  //          "reelInstance":{
  //             "0":9,
  //             "1":9,
  //             "2":9,
  //             "3":9,
  //             "4":9
  //          },
  //          "useWildSub":true,
  //          "multiplier":[
  //             [
  //                100,
  //                0
  //             ],
  //             [
  //                50,
  //                0
  //             ],
  //             [
  //                25,
  //                0
  //             ]
  //          ]
  //       },
  //       {
  //          "Name":"1",
  //          "Id":1,
  //          "reelInstance":{
  //             "0":9,
  //             "1":9,
  //             "2":9,
  //             "3":9,
  //             "4":9
  //          },
  //          "useWildSub":true,
  //          "multiplier":[
  //             [
  //                100,
  //                0
  //             ],
  //             [
  //                50,
  //                0
  //             ],
  //             [
  //                25,
  //                0
  //             ]
  //          ]
  //       },
  //       {
  //          "Name":"2",
  //          "Id":2,
  //          "reelInstance":{
  //             "0":9,
  //             "1":9,
  //             "2":9,
  //             "3":9,
  //             "4":9
  //          },
  //          "useWildSub":true,
  //          "multiplier":[
  //             [
  //                100,
  //                0
  //             ],
  //             [
  //                50,
  //                0
  //             ],
  //             [
  //                25,
  //                0
  //             ]
  //          ]
  //       },
  //       {
  //          "Name":"3",
  //          "Id":3,
  //          "reelInstance":{
  //             "0":9,
  //             "1":9,
  //             "2":9,
  //             "3":9,
  //             "4":9
  //          },
  //          "useWildSub":true,
  //          "multiplier":[
  //             [
  //                100,
  //                0
  //             ],
  //             [
  //                50,
  //                0
  //             ],
  //             [
  //                25,
  //                0
  //             ]
  //          ]
  //       },
  //       {
  //          "Name":"4",
  //          "Id":4,
  //          "reelInstance":{
  //             "0":9,
  //             "1":9,
  //             "2":9,
  //             "3":9,
  //             "4":9
  //          },
  //          "useWildSub":true,
  //          "multiplier":[
  //             [
  //                100,
  //                0
  //             ],
  //             [
  //                50,
  //                0
  //             ],
  //             [
  //                25,
  //                0
  //             ]
  //          ]
  //       },
  //       {
  //          "Name":"5",
  //          "Id":5,
  //          "reelInstance":{
  //             "0":4,
  //             "1":4,
  //             "2":4,
  //             "3":4,
  //             "4":4
  //          },
  //          "useWildSub":true,
  //          "multiplier":[
  //             [
  //                200,
  //                0
  //             ],
  //             [
  //                80,
  //                0
  //             ],
  //             [
  //                40,
  //                0
  //             ]
  //          ]
  //       },
  //       {
  //          "Name":"6",
  //          "Id":6,
  //          "reelInstance":{
  //             "0":4,
  //             "1":4,
  //             "2":4,
  //             "3":4,
  //             "4":4
  //          },
  //          "useWildSub":true,
  //          "multiplier":[
  //             [
  //                200,
  //                0
  //             ],
  //             [
  //                80,
  //                0
  //             ],
  //             [
  //                40,
  //                0
  //             ]
  //          ]
  //       },
  //       {
  //          "Name":"7",
  //          "Id":7,
  //          "reelInstance":{
  //             "0":4,
  //             "1":4,
  //             "2":4,
  //             "3":4,
  //             "4":4
  //          },
  //          "useWildSub":true,
  //          "multiplier":[
  //             [
  //                200,
  //                0
  //             ],
  //             [
  //                80,
  //                0
  //             ],
  //             [
  //                40,
  //                0
  //             ]
  //          ]
  //       },
  //       {
  //          "Name":"8",
  //          "Id":8,
  //          "reelInstance":{
  //             "0":4,
  //             "1":4,
  //             "2":4,
  //             "3":4,
  //             "4":4
  //          },
  //          "useWildSub":true,
  //          "multiplier":[
  //             [
  //                200,
  //                0
  //             ],
  //             [
  //                80,
  //                0
  //             ],
  //             [
  //                40,
  //                0
  //             ]
  //          ]
  //       },
  //       {
  //          "Name":"FreeSpin",
  //          "Id":9,
  //          "reelInstance":{
  //             "0":3,
  //             "1":3,
  //             "2":3,
  //             "3":3,
  //             "4":3
  //          },
  //          "description":"Activates 3, 5, or 10 free spins when 3, 4, or 5 symbols appear anywhere on the result matrix.",
  //          "useWildSub":false,
  //          "multiplier":[
  //             [
  //                0,
  //                10
  //             ],
  //             [
  //                0,
  //                5
  //             ],
  //             [
  //                0,
  //                3
  //             ]
  //          ]
  //       },
  //       {
  //          "Name":"Wild",
  //          "Id":10,
  //          "reelInstance":{
  //             "0":2,
  //             "1":2,
  //             "2":2,
  //             "3":2,
  //             "4":2
  //          },
  //          "description":"Substitutes for all symbols except Jackpot, Free Spin, Bonus, and Scatter.",
  //          "useWildSub":false,
  //          "multiplier":[
  //
  //          ]
  //       },
  //       {
  //          "Name":"Scatter",
  //          "Id":11,
  //          "reelInstance":{
  //             "0":2,
  //             "1":2,
  //             "2":2,
  //             "3":2,
  //             "4":2
  //          },
  //          "description":"Scatter: Offers higher pay outs when 3 or more symbols appear anywhere on the result matrix. Payout: 5x - 1000, 4x - 700, 3x - 500",
  //          "useWildSub":false,
  //          "multiplier":[
  //             [
  //                1000,
  //                0
  //             ],
  //             [
  //                700,
  //                0
  //             ],
  //             [
  //                500,
  //                0
  //             ]
  //          ]
  //       },
  //       {
  //          "Name":"Jackpot",
  //          "Id":12,
  //          "reelInstance":{
  //             "0":1,
  //             "1":1,
  //             "2":1,
  //             "3":1,
  //             "4":1
  //          },
  //          "description":"Mega win triggered by 5 Jackpot symbols appearing anywhere on the result matrix. Payout: 5000x",
  //          "useWildSub":false,
  //          "multiplier":[
  //
  //          ],
  //          "defaultAmount":5000,
  //          "symbolsCount":5,
  //          "increaseValue":5
  //       },
  //       {
  //          "Name":"Bonus",
  //          "Id":13,
  //          "reelInstance":{
  //             "0":20,
  //             "1":30,
  //             "2":3,
  //             "3":3,
  //             "4":3
  //          },
  //          "description":"Starts a spinning wheel game for a pay out when 3 or more symbols appear anywhere on the result matrix.",
  //          "useWildSub":false,
  //          "symbolCount":3
  //       }
  //    ]
  // }
]
