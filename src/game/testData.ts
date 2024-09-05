export const moolahPayOut = [5, 10, 15, 20]
export const gameData = [

    {
        "id": "SL-CRZ",
        "matrix": {
            "x": 4,
            "y": 3
        },
        "linesApiData": [
            [1, 1, 1]
        ],
        "bonus" : false,
        "linesCount": [1],
        "bets": [0.1, 0.25, 0.5, 0.75, 1],
        "Symbols": [
            {
                "Name": "Blank",
                "Id": 0,
                "isSpecial" : false,
                "payout": 0,
                "mixedPayout": 0,
                "canmatch": [],
                "reelInstance": {
                    "0": 60,
                    "1": 62,
                    "2": 55,
                    "4": 2
                }
            },
            {
                "Name": "777",
                "Id": 1,
                "payout": 1000,
                "mixedPayout": 200,
                "isSpecial" : false,
                "canmatch": ["2", "3"],
                "reelInstance": {
                    "0": 5,
                    "1": 0,
                    "2": 0,
                    "4": 2
                }
            },
            {
                "Name": "77",
                "Id": 2,
                "payout": 200,
                "mixedPayout": 0,
                "isSpecial" : false,
                "canmatch": ["1", "3"],
                "reelInstance": {
                    "0": 4,
                    "1": 0,
                    "2": 0,
                    "4": 2
                }
            },
            {
                "Name": "7",
                "Id": 3,
                "payout": 5,
                "mixedPayout": 0,
                "isSpecial" : false,
                "canmatch": ["1", "2"],
                "reelInstance": {
                    "0": 2,
                    "1": 5,
                    "2": 8,
                    "4": 2
                }
            },
            {
                "Name": "bar/bar",
                "Id": 4,
                "payout": 40,
                "mixedPayout": 0,
                "isSpecial" : false,
                "canmatch": ["5"],
                "reelInstance": {
                    "0": 1,
                    "1": 0,
                    "2": 0,
                    "4": 2
                }
            },
            {
                "Name": "bar",
                "Id": 5,
                "payout": 20,
                "mixedPayout": 0,
                "isSpecial" : false,
                "canmatch": ["4"],
                "reelInstance": {
                    "0": 0,
                    "1": 4,
                    "2": 5,
                    "4": 2
                }
            },
            {
                "Name": "10x",
                "Id": 6,
                "payout": 10,
                "mixedPayout": 0,
                "isSpecial" : true,
                "canmatch": [],
                "SpecialType " : "MULTIPLY",
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 4,
                    "4": 2
                }
            },
            {
                "Name": "5X",
                "Id": 7,
                "payout": 5,
                "mixedPayout": 0,
                "SpecialType " : "MULTIPLY",
                "isSpecial" : true,
                "canmatch": [],
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 4,
                    "4": 2
                }
            },
            {
                "Name": "2X",
                "Id": 8,
                "payout": 2,
                "mixedPayout": 0,
                "SpecialType " : "MULTIPLY",
                "isSpecial" : true,
                "canmatch": [],
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 4,
                    "4": 2
                }
            },
            {
                "Name": "DOUBLE+",
                "Id": 9,
                "payout": 100,
                "mixedPayout": 0,
                "SpecialType " : "ADD",
                "isSpecial" : true,
                "canmatch": [],
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 4,
                    "4": 2
                }
                
            },
            {
                "Name": "ADD",
                "Id": 10,
                "payout": 10,
                "mixedPayout": 0,
                "SpecialType " : "ADD",
                "isSpecial" : true,
                "canmatch": [],
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 40,
                }
            },
            {
                "Name": "RESPIN",
                "Id": 11,
                "payout": 0,
                "mixedPayout": 0,
                "isSpecial" : true,
                "canmatch": [],
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 4,
                    "4": 2
                }
            }
        ],
        "defaultPayout": 10 
    }

]