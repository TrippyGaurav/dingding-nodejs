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
        "linesCount": [1],
        "bets": [0.02,0.04,0.1,0.2,0.3,0.5,1,1.5,3,7,10,15,20,32,64],
        "Symbols": [
            {
                "Name": "Blank",
                "Id": 0,
                "isSpecial" : false,
                "payout": 0,
                "SpecialType": "",
                "mixedPayout": 0,
                "canmatch": [],
                "reelInstance": {
                    "0": 35,
                    "1": 35,
                    "2": 35,
                    "3": 20
                }
            },
            {
                "Name": "777",
                "Id": 1,
                "payout": 1000,
                "mixedPayout": 50,
                "isSpecial" : false,
                "SpecialType": "",
                "canmatch": ["1","2", "3"],
                "reelInstance": {
                    "0": 25,
                    "1": 24,
                    "2": 23,
                    "3": 0
                }
            },
            {
                "Name": "77",
                "Id": 2,
                "payout": 300,
                "mixedPayout": 50,
                "isSpecial" : false,
                "SpecialType": "",
                "canmatch": ["1","2", "3"],
                "reelInstance": {
                    "0": 15,
                    "1": 15,
                    "2": 10,
                    "3": 0
                }
            },
            {
                "Name": "7",
                "Id": 3,
                "payout": 100,
                "mixedPayout": 50,
                "isSpecial" : false,
                "SpecialType": "",
                "canmatch": ["1", "2","3"],
                "reelInstance": {
                    "0": 20,
                    "1": 24,
                    "2": 25,
                    "3": 0
                }
            },
            {
                "Name": "bar/bar",
                "Id": 4,
                "payout": 200,
                "mixedPayout": 30,
                "isSpecial" : false,
                "SpecialType": "",
                "canmatch": ["4","5"],
                "reelInstance": {
                    "0": 15,
                    "1": 15,
                    "2": 15,
                    "3": 0
                }
            },
            {
                "Name": "bar",
                "Id": 5,
                "payout": 100,
                "mixedPayout": 30,
                "isSpecial" : false,
                "SpecialType": "",
                "canmatch": ["4","5"],
                "reelInstance": {
                    "0": 15,
                    "1": 15,
                    "2": 15,
                    "3": 2
                }
            },
            {
                "Name": "10x",
                "Id": 6,
                "payout": 10,
                "mixedPayout": 0,
                "isSpecial" : true,
                "canmatch": [],
                "SpecialType": "MULTIPLY",
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 0,
                    "3": 8
                }
            },
            {
                "Name": "5X",
                "Id": 7,
                "payout": 5,
                "mixedPayout": 0,
                "SpecialType": "MULTIPLY",
                "isSpecial" : true,
                "canmatch": [],
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 0,
                    "3": 12
                }
            },
            {
                "Name": "2X",
                "Id": 8,
                "payout": 2,
                "mixedPayout": 0,
                "SpecialType": "MULTIPLY",
                "isSpecial" : true,
                "canmatch": [],
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 0,
                    "3": 15
                }
            },
            {
                "Name": "DOUBLE+",
                "Id": 9,
                "payout": 100,
                "mixedPayout": 0,
                "SpecialType": "ADD",
                "isSpecial" : true,
                "canmatch": [],
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 0,
                    "3": 10
                }
                
            },
            {
                "Name": "ADD",
                "Id": 10,
                "payout": 10,
                "mixedPayout": 0,
                "SpecialType": "ADD",
                "isSpecial" : true,
                "canmatch": [],
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 0,
                    "3": 10
                }
            },
            {
                "Name": "RESPIN",
                "Id": 11,
                "payout": 0,
                "mixedPayout": 0,
                "isSpecial" : true,
                "SpecialType": "RESPIN",
                "canmatch": [],
                "reelInstance": {
                    "0": 0,
                    "1": 0,
                    "2": 0,
                    "3": 10
                }
            }
        ],
        "defaultPayout": 10 
    }

]