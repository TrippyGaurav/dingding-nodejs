
import { Player } from "../../dashboard/users/userModel";
import { UserData } from "../../utils/globalTypes";
export enum specialIcons {
    bonus = "Bonus",
    scatter = "Scatter",
    jackpot = "Jackpot",
    wild = "Wild",
    any = "any",
    FreeSpin = "FreeSpin"
}
export interface RequiredSocketMethods {
    sendMessage(action: string, message: any): void;
    sendError(error: string): void;
    sendAlert(alert: string): void;
    messageHandler(data: any): void;
    updatePlayerBalance(amount: number): void;
    deductPlayerBalance(amount: number): void;
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
    CREDITSUPDATE = 'creditsUpdate'
}

export const getCurrentRTP = {
    playerWon: 0,
    playerTotalBets: 0,
};


export enum gameCategory {
    SLOT = "SL",
    KENO = "KN",
}

export interface BonusPayEntry {
    symbolCount: number;
    symbolID: number;
    pay: number;
    highestPayMultiplier: number;
}
export interface ScatterPayEntry {
    symbolCount: number;
    symbolID: number;
    pay: number;
    freeSpins: number;
}

export enum ResultType {
    moolah = "moolah",
    normal = "normal",
}
export const betMultiplier = [0.1, 0.25, 0.5, 0.75, 1];


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
            "multiplier": element.multiplier ,
            "defaultAmount": element.defaultAmount ,
            "symbolsCount": element.symbolsCount ,
            "increaseValue": element.increaseValue ,
            "freeSpin": element.freeSpin,
            "description": element.description,
            "payout": element.payout,
            "mixedPayout": element.mixedPayout,
            "defaultPayout": element.defaultPayout
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

export async function getPlayerCredits(playerName: string) {
    try {
        const currentUser = await Player.findOne({ username: playerName }).exec();
        if (!currentUser) {
            return `No user found with playerName ${playerName}`;
        }
        return currentUser.credits;
    } catch (error) {
        console.error(`Error fetching credits for player ${playerName}:`, error);
        return `An error occurred while fetching credits for player ${playerName}.`;
    }
}