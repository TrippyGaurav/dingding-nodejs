import { UserData } from "./gameType";

export enum specialIcons {
    bonus = "Bonus",
    scatter = "Scatter",
    jackpot = "Jackpot",
    wild = "Wild",
    any = "any",
}

export enum bonusGameType {
    tap = "tap",
    spin = "spin",
    default = "default",
}

export const PlayerData: UserData = {
    Balance: 0,
    haveWon: 0,
    currentWining: 0
}

export const enum messageType {
    ALERT = "alert",
    MESSAGE = "message",
    ERROR = "internalError",
}

export const getCurrentRTP = {
    playerWon: 0,
    playerTotalBets: 0,
};


export enum gameCategory {
    SLOT = "SL",
    KENO = "KN",
}

export const UiInitData = {
    paylines: null,
    spclSymbolTxt: [],
    AbtLogo: {
        logoSprite: "https://iili.io/JrMCqPf.png",
        link: "https://dingding-game.vercel.app/login",
    },
    ToULink: "https://dingding-game.vercel.app/login",
    PopLink: "https://dingding-game.vercel.app/login",
};


export function convertSymbols(data) {
    let uiData = {
        symbols: [],
    };


    if (!Array.isArray(data)) {
        // console.error("Input data is not an array");
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


export function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let k = array[i];
        array[i] = array[j];
        array[j] = k;
    }
}