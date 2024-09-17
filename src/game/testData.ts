export const moolahPayOut = [5, 10, 15, 20]
export const gameData = [

    {
        "id": "SL-WOF",
        "isSpecial" : true,
        "matrix": {
            "x": 3,
            "y": 5
        },
        "bonus":{
        "type":"spin",
        "isEnabled":true,
        "noOfItem":8,
        "payOut":[
            200,
            100,
            70,
            50,
            30,
            20,
            10,
            5
        ],
        "payOutProb":[
            0.05,
            0.5,
            1,
            3,
            10,
            20,
            25,
            39.4
        ]
    },
        "linesApiData": [
            [1, 1, 1]
        ],
        "linesCount": [1],
        "bets": [0.02, 0.04, 0.1, 0.2, 0.3, 0.5, 1, 1.5, 3, 7, 10, 15, 20, 32, 64],
        "Symbols": [
            {
                "Name": "Blank",
                "Id": 0,
                "payout": 0,
                "mixedPayout": 0,
                "isSpecialWof" : false,
                "canmatch": [],
                "reelInstance": {
                    "0": 35,
                    "1": 35,
                    "2": 35
                }
            },
            {
                "Name": "777",
                "Id": 1,
                "payout": 1000,
                "mixedPayout": 20,
                "isSpecialWof" : false,
                "canmatch": ["1","2", "3","6","7","8","11"],
                "reelInstance": {
                    "0": 25,
                    "1": 24,
                    "2": 23
                }
            },
            {
                "Name": "77",
                "Id": 2,
                "payout": 200,
                "mixedPayout": 20,
                "isSpecialWof" : false,
                "canmatch": ["1","2", "3","6","7","8","11"],
                "reelInstance": {
                    "0": 15,
                    "1": 15,
                    "2": 10
                }
            },
            {
                "Name": "7",
                "Id": 3,
                "payout": 5,
                "mixedPayout": 20,
                "isSpecialWof" : false,
                "canmatch": ["1","2", "3","6","7","8","11"],
                "reelInstance": {
                    "0": 20,
                    "1": 24,
                    "2": 25
                }
            },
            {
                "Name": "5_bar",
                "Id": 4,
                "payout": 40,
                "mixedPayout": 30,
                "isSpecialWof" : false,
                "canmatch": ["4","5","9","10"],
                "reelInstance": {
                    "0": 15,
                    "1": 15,
                    "2": 15
                }
            },
            {
                "Name": "bar",
                "Id": 5,
                "payout": 30,
                "mixedPayout": 0,
                "isSpecialWof" : false,
                "canmatch": ["4","5","9","10"],
                "reelInstance": {
                    "0": 15,
                    "1": 15,
                    "2": 15
                }
            },
            {
                "Name": "777T",
                "Id": 6,
                "payout": 1000,
                "mixedPayout": 20,
                "isSpecialWof" : true,
                "canmatch": ["1","2", "3","6","7","8","11"],
                "reelInstance": {
                    "0": 25,
                    "1": 24,
                    "2": 23
                }
            },
            {
                "Name": "77T",
                "Id": 7,
                "payout": 200,
                "mixedPayout": 20,
                "isSpecialWof" : true,
                "canmatch": ["1","2", "3","6","7","8","11"],
                "reelInstance": {
                    "0": 15,
                    "1": 15,
                    "2": 10
                }
            },
            {
                "Name": "7T",
                "Id": 8,
                "payout": 5,
                "mixedPayout": 20,
                "isSpecialWof" : true,
                "canmatch": ["1","2", "3","6","7","8","11"],
                "reelInstance": {
                    "0": 20,
                    "1": 24,
                    "2": 25
                }
            },
            {
                "Name": "5_barT",
                "Id": 9,
                "payout": 40,
                "mixedPayout": 30,
                "isSpecialWof" : true,
                "canmatch": ["4","5","9","10"],
                "reelInstance": {
                    "0": 15,
                    "1": 15,
                    "2": 15
                }
            },
            {
                "Name": "barT",
                "Id": 10,
                "payout": 30,
                "mixedPayout": 0,
                "isSpecialWof" : true,
                "canmatch": ["4","5","9","10"],
                "reelInstance": {
                    "0": 15,
                    "1": 15,
                    "2": 15
                }
            },
            {
                "Name": "WOF777",
                "Id": 11,
                "payout": 10,
                "mixedPayout": 0,
                "isSpecialWof" : true,
                "canmatch": ["1","2", "3","6","7","8","11"],
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 0
                }
            },
            {
                "Name": "Bonus",
                "Id": 12,
                "payout": 5,
                "mixedPayout": 0,
                "symbolsCount": 2,
                "canmatch": [],
                "reelInstance": {
                    "0":30,
                    "1":30,
                    "2":30
                }
            }
        ],
        "defaultPayout": 10
    }
    // {
    //     "id": "SL-CRZ",
    //     "isSpecial": true,
    //     "matrix": {
    //         "x": 4,
    //         "y": 3
    //     },
    //     "linesApiData": [
    //         [1, 1, 1]
    //     ],
    //     "linesCount": [1],
    //     "bets": [0.02, 0.04, 0.1, 0.2, 0.3, 0.5, 1, 1.5, 3, 7, 10, 15, 20, 32, 64],
    //     "Symbols": [
    //         {
    //             "Name": "Blank",
    //             "Id": 0,
    //             "isSpecialCrz": false,
    //             "payout": 0,
    //             "SpecialType": "",
    //             "mixedPayout": 0,
    //             "canmatch": [],
    //             "reelInstance": {
    //                 "0": 35,
    //                 "1": 35,
    //                 "2": 35,
    //                 "3": 0
    //             }
    //         },
    //         {
    //             "Name": "777",
    //             "Id": 1,
    //             "payout": 1000,
    //             "mixedPayout": 20,
    //             "isSpecialCrz": false,
    //             "SpecialType": "",
    //             "canmatch": ["1", "2", "3"],
    //             "reelInstance": {
    //                 "0": 25,
    //                 "1": 24,
    //                 "2": 23,
    //                 "3": 0
    //             }
    //         },
    //         {
    //             "Name": "77",
    //             "Id": 2,
    //             "payout": 200,
    //             "mixedPayout": 20,
    //             "isSpecialCrz": false,
    //             "SpecialType": "",
    //             "canmatch": ["1", "2", "3"],
    //             "reelInstance": {
    //                 "0": 15,
    //                 "1": 15,
    //                 "2": 10,
    //                 "3": 0
    //             }
    //         },
    //         {
    //             "Name": "7",
    //             "Id": 3,
    //             "payout": 5,
    //             "mixedPayout": 20,
    //             "isSpecialCrz": false,
    //             "SpecialType": "",
    //             "canmatch": ["1", "2", "3"],
    //             "reelInstance": {
    //                 "0": 20,
    //                 "1": 24,
    //                 "2": 25,
    //                 "3": 0
    //             }
    //         },
    //         {
    //             "Name": "bar/bar",
    //             "Id": 4,
    //             "payout": 40,
    //             "mixedPayout": 30,
    //             "isSpecialCrz": false,
    //             "SpecialType": "",
    //             "canmatch": ["4", "5"],
    //             "reelInstance": {
    //                 "0": 15,
    //                 "1": 15,
    //                 "2": 15,
    //                 "3": 0
    //             }
    //         },
    //         {
    //             "Name": "bar",
    //             "Id": 5,
    //             "payout": 30,
    //             "mixedPayout": 0,
    //             "isSpecialCrz": false,
    //             "SpecialType": "",
    //             "canmatch": ["4", "5"],
    //             "reelInstance": {
    //                 "0": 15,
    //                 "1": 15,
    //                 "2": 15,
    //                 "3": 0
    //             }
    //         },
    //         {
    //             "Name": "10x",
    //             "Id": 6,
    //             "payout": 10,
    //             "mixedPayout": 0,
    //             "isSpecialCrz": true,
    //             "canmatch": [],
    //             "SpecialType": "MULTIPLY",
    //             "reelInstance": {
    //                 "0": 0,
    //                 "1": 0,
    //                 "2": 0,
    //                 "3": 0
    //             }
    //         },
    //         {
    //             "Name": "5X",
    //             "Id": 7,
    //             "payout": 5,
    //             "mixedPayout": 0,
    //             "SpecialType": "MULTIPLY",
    //             "isSpecialCrz": true,
    //             "canmatch": [],
    //             "reelInstance": {
    //                 "0": 0,
    //                 "1": 0,
    //                 "2": 0,
    //                 "3": 0
    //             }
    //         },
    //         {
    //             "Name": "2X",
    //             "Id": 8,
    //             "payout": 2,
    //             "mixedPayout": 0,
    //             "SpecialType": "MULTIPLY",
    //             "isSpecialCrz": true,
    //             "canmatch": [],
    //             "reelInstance": {
    //                 "0": 0,
    //                 "1": 0,
    //                 "2": 0,
    //                 "3": 0
    //             }
    //         },
    //         {
    //             "Name": "DOUBLE+",
    //             "Id": 9,
    //             "payout": 100,
    //             "mixedPayout": 0,
    //             "SpecialType": "ADD",
    //             "isSpecialCrz": true,
    //             "canmatch": [],
    //             "reelInstance": {
    //                 "0": 0,
    //                 "1": 0,
    //                 "2": 0,
    //                 "3": 0
    //             }

    //         },
    //         {
    //             "Name": "ADD",
    //             "Id": 10,
    //             "payout": 10,
    //             "mixedPayout": 0,
    //             "SpecialType": "ADD",
    //             "isSpecialCrz": true,
    //             "canmatch": [],
    //             "reelInstance": {
    //                 "0": 0,
    //                 "1": 0,
    //                 "2": 0,
    //                 "3": 0
    //             }
    //         },
    //         {
    //             "Name": "RESPIN",
    //             "Id": 11,
    //             "payout": 0,
    //             "mixedPayout": 0,
    //             "SpecialType": "RESPIN",
    //             "isSpecialCrz": true,
    //             "canmatch": [],
    //             "reelInstance": {
    //                 "0": 0,
    //                 "1": 0,
    //                 "2": 0,
    //                 "3": 40
    //             }
    //         }
    //     ],
    //     "defaultPayout": 10
    // }
]

// export const gameData = [{
//     "id": "SL-CM",
//     "isSpecial": true,
//     "matrix": {
//         "x": 3,
//         "y": 1
//     },
//     "bets": [
//         1,
//         5,
//         10
//     ],
//     "Symbols": [
//         {
//             "Name": "Blank",
//             "Id": 0,
//             "payout": "",
//             "canCallRedSpin": false,
//             "canCallRespin": false,
//             "reelInstance": {
//                 "0": 60,
//                 "1": 62,
//                 "2": 55
//             }
//         },
//         {
//             "Name": "1",
//             "Id": 1,
//             "payout": "1",
//             "canCallRedSpin": true,
//             "canCallRespin": false,
//             "reelInstance": {
//                 "0": 5,
//                 "1": 0,
//                 "2": 0
//             }
//         },
//         {
//             "Name": "2",
//             "Id": 2,
//             "payout": "2",
//             "canCallRedSpin": true,
//             "canCallRespin": false,
//             "reelInstance": {
//                 "0": 4,
//                 "1": 0,
//                 "2": 0
//             }
//         },
//         {
//             "Name": "5",
//             "Id": 3,
//             "payout": "5",
//             "canCallRedSpin": true,
//             "canCallRespin": false,
//             "reelInstance": {
//                 "0": 2,
//                 "1": 5,
//                 "2": 8
//             }
//         },
//         {
//             "Name": "10",
//             "Id": 4,
//             "payout": "10",
//             "canCallRedSpin": false,
//             "canCallRespin": false,
//             "reelInstance": {
//                 "0": 1,
//                 "1": 0,
//                 "2": 0
//             }
//         },
//         {
//             "Name": "0",
//             "Id": 5,
//             "payout": "0",
//             "canCallRedSpin": false,
//             "canCallRespin": true,
//             "reelInstance": {
//                 "0": 0,
//                 "1": 30,
//                 "2": 0
//             }
//         },
//         {
//             "Name": "doubleZero",
//             "Id": 6,
//             "payout": "00",
//             "canCallRedSpin": false,
//             "canCallRespin": true,
//             "reelInstance": {
//                 "0": 0,
//                 "1": 0,
//                 "2": 40
//             }
//         }
//     ]
// }]