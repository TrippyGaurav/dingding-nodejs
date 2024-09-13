import { WinData } from "../BaseSlotGame/WinData";
import { convertSymbols, UiInitData } from "../../Utils/gameUtils";
import { SLCRZ } from "./crazy777Base";

export function initializeGameSettings(gameData: any, gameInstance: SLCRZ) {
    return {
        id: gameData.gameSettings.id,
        isSpecial: gameData.gameSettings.isSpecial,
        matrix: gameData.gameSettings.matrix,
        bets: gameData.gameSettings.bets,
        Symbols: gameInstance.initSymbols,
        resultSymbolMatrix: [],
        currentGamedata: gameData.gameSettings,
        _winData: new WinData(gameInstance),
        canmatch : [],
        mixedPayout: 0,
        currentBet: 0,
        currentLines: 0,
        BetPerLines: 0,
        reels: [],
        defaultPayout: gameData.gameSettings.defaultPayout,
        SpecialType : gameData.gameSettings.SpecialType,
        isSpecialCrz : gameData.gameSettings.isSpecialCrz,
        freeSpinCount : 0,
        isFreeSpin: false,
        
    };
}

export function generateInitialReel(gameSettings: any): string[][] {
    const reels = [[], [], [], []];
    gameSettings.Symbols.forEach(symbol => {
        for (let i = 0; i < 4; i++) {
            const count = symbol.reelInstance[i] || 0;
            for (let j = 0; j < count; j++) {
                reels[i].push(symbol.Id);
            }
        }
    });
    reels.forEach(reel => {
        shuffleArray(reel);
    });
    return reels;
}

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function sendInitData(gameInstance: SLCRZ) {
    const reels = generateInitialReel(gameInstance.settings);
    gameInstance.settings.reels = reels;
    const dataToSend = {
        GameData: {
            Reel: reels,
            Bets: gameInstance.settings.currentGamedata.bets,
            autoSpin: [1, 5, 10, 20],
        },
        UIData: UiInitData,
        PlayerData: {
            Balance: gameInstance.getPlayerData().credits,
            haveWon: gameInstance.playerData.haveWon,
            currentWining: gameInstance.playerData.currentWining,
            totalbet: gameInstance.playerData.totalbet,
        },
    };
    gameInstance.sendMessage("InitData", dataToSend);
}
export function calculatePayout(gameInstance: any, symbols: any[], symbolId: number, winType: string): number {
    const symbol = gameInstance.settings.Symbols.find(sym => sym.Id === symbolId);
    let payout = 0;

    if (winType === 'regular') {
        payout = symbol.payout * gameInstance.settings.currentBet; 
    } else if (winType === 'mixed') {
        payout = symbol.mixedPayout * gameInstance.settings.currentBet;
    }

    return payout;
}

export function applyExtraSymbolEffect(gameInstance: any, payout: number, extraSymbolId: number): number {
    const extraSymbol = gameInstance.settings.Symbols.find(sym => sym.Id === extraSymbolId);

    if (extraSymbol && extraSymbol.isSpecialCrz) {
        if (extraSymbol.SpecialType === "MULTIPLY") {
            console.log(`Special MULTIPLY: Multiplying payout by ${extraSymbol.payout}`);
            return payout * extraSymbol.payout;  
        } else if (extraSymbol.SpecialType === "ADD") {
            console.log(`Special ADD: Adding extra payout based on bet.`);
            const additionalPayout = extraSymbol.payout * gameInstance.settings.currentBet;
            return payout + additionalPayout;
        } else if (extraSymbol.SpecialType === "RESPIN") {
            gameInstance.settings.isFreeSpin = true;
            const freeSpinCount = Math.floor(Math.random() * 3) + 3;
            console.log("Free spin started");
            return payout;
        }
    }

    console.log("No special effect from the extra symbol.");
    return payout;
}
export function checkWinningCondition(gameInstance: any, row: any[]): { winType: string, symbolId?: number } {
    const firstSymbolId = row[0];

    const allSame = row.every(symbol => symbol === firstSymbolId);
    if (allSame) {
        return { winType: 'regular', symbolId: firstSymbolId };
    }

    const firstSymbol = gameInstance.settings.Symbols.find(sym => sym.Id === firstSymbolId);  // Access through gameInstance
    const canMatch = firstSymbol.canmatch;
    const isMixedWin = row.slice(1).every(symbol => canMatch.includes(symbol.toString()));

    if (isMixedWin) {
        return { winType: 'mixed', symbolId: firstSymbolId };
    }
    return { winType: 'default' };
}
