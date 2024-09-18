import { WinData } from "../BaseSlotGame/WinData";
import { convertSymbols, UiInitData } from "../../Utils/gameUtils";
import { SLWOF } from "./wheelOfFortuneBase";
import { WINNINGTYPE } from "./types";
import { CloudWatchLogs } from "aws-sdk";

export function initializeGameSettings(gameData: any, gameInstance: SLWOF) {
    return {
        id: gameData.gameSettings.id,
        isSpecial: gameData.gameSettings.isSpecial,
        bonus: gameData.gameSettings.bonus,
        matrix: gameData.gameSettings.matrix,
        bets: gameData.gameSettings.bets,
        Symbols: gameInstance.initSymbols,
        resultSymbolMatrix: [],
        currentGamedata: gameData.gameSettings,
        _winData: new WinData(gameInstance),
        canmatch: [],
        mixedPayout: 0,
        currentBet: 0,
        currentLines: 0,
        BetPerLines: 0,
        reels: [],
        defaultPayout: gameData.gameSettings.defaultPayout,
        SpecialType: gameData.gameSettings.SpecialType,
        isSpecialWof: gameData.gameSettings.isSpecialWof,
        symbolsCount: gameData.gameSettings.symbolsCount,
        bonusStopIndex: 0
    };
}

export function generateInitialReel(gameSettings: any): string[][] {
    const reels = [[], [], [], []];
    gameSettings.Symbols.forEach(symbol => {
        for (let i = 0; i < 3; i++) {
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

export function triggerBonusGame(settings: any): number {
    const { payOut, payOutProb } = settings.bonus;
    const randomValue = Math.random() * 100;
    let cumulativeProbability = 0;
    for (let i = 0; i < payOut.length; i++) {
        cumulativeProbability += payOutProb[i];
        if (randomValue <= cumulativeProbability) {
            console.log(`Bonus Game: Selected payout is ${payOut[i]} `);
            return payOut[i];
        }
    }
    return payOut[payOut.length - 1];
}


export function sendInitData(gameInstance: SLWOF) {
    UiInitData.paylines = convertSymbols(gameInstance.settings.Symbols);
    const credits = gameInstance.getPlayerData().credits
    const Balance = credits.toFixed(2)
    const reels = generateInitialReel(gameInstance.settings);
    gameInstance.settings.reels = reels;
    const dataToSend = {
        GameData: {
            Bets: gameInstance.settings.currentGamedata.bets,
        },
        UIData: UiInitData,
        PlayerData: {
            Balance: Balance,
            haveWon: gameInstance.playerData.haveWon,
            currentWining: gameInstance.playerData.currentWining,
            totalbet: gameInstance.playerData.totalbet,
        },
    };
    gameInstance.sendMessage("InitData", dataToSend);
}

export function checkWinningCondition(gameInstance: SLWOF, row: any[]): { winType: string; symbolId?: number } {
    try {
        if (row.length === 0) {
            throw new Error("Row is empty, cannot check winning condition.");
        }
        const firstSymbolId = row[0];
        const firstSymbol = gameInstance.settings.Symbols.find(sym => sym.Id === firstSymbolId);
        if (!firstSymbol) {
            throw new Error(`Symbol with Id ${firstSymbolId} not found.`);
        }
        const allSame = row.every(symbol => symbol === firstSymbolId);
        if (allSame) {
            return { winType: WINNINGTYPE.REGULAR, symbolId: firstSymbolId };
        }
        if (firstSymbol.canmatch.length > 0) {
            const canMatchSet = new Set(firstSymbol.canmatch.map(String));
            const isMixedWin = row.slice(1).every(symbol => canMatchSet.has(symbol.toString()));
            if (isMixedWin) {
                return { winType: WINNINGTYPE.MIXED, symbolId: firstSymbolId };
            }
        }

        return { winType: WINNINGTYPE.DEFAULT };
    } catch (error) {
        console.error("Error in checkWinningCondition:", error.message);
        return { winType: 'error' };
    }
}


export async function calculatePayout(gameInstance: SLWOF, symbols: any[], symbolId: number, winType: string): Promise<number> {
    try {
        const symbol = gameInstance.settings.Symbols.find(sym => sym.Id === symbolId);
        if (!symbol) {
            throw new Error(`Symbol with Id ${symbolId} not found.`);
        }

        let payout = 0;
        switch (winType) {
            case WINNINGTYPE.REGULAR:
                payout = symbol.payout * gameInstance.settings.BetPerLines;
                break;

            case WINNINGTYPE.MIXED:
                payout = symbol.mixedPayout * gameInstance.settings.BetPerLines;
                break;

            default:
                throw new Error(`Invalid winType: ${winType}`);
        }
        return payout;
    } catch (error) {
        console.error("Error calculating payout:", error.message);
        return 0;
    }
}

export function makeResultJson(gameInstance: SLWOF, winningRows: number[]) {
    try {
        const { settings, playerData } = gameInstance;
        const credits = gameInstance.getPlayerData().credits
        const Balance = credits.toFixed(2)
        const sendData = {
            gameData: {
                resultSymbols: settings.resultSymbolMatrix,
                linestoemit: winningRows
            },
            PlayerData: {
                Balance: Balance,
                currentWining: playerData.currentWining,
                totalbet: playerData.totalbet,
                haveWon: playerData.haveWon,
            }
        };

        gameInstance.sendMessage('ResultData', sendData);
    } catch (error) {
        console.error("Error generating result JSON or sending message:", error);
    }
}