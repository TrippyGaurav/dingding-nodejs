import { WinData } from "../BaseSlotGame/WinData";
import { convertSymbols, UiInitData } from "../../Utils/gameUtils";
import { SLCM } from "./cashMachineBase";

export function initializeGameSettings(gameData: any, gameInstance: SLCM) {
    return {
        id: gameData.gameSettings.id,
        isSpecial: gameData.gameSettings.isSpecial,
        matrix: gameData.gameSettings.matrix,
        bets: gameData.gameSettings.bets,
        Symbols: gameInstance.initSymbols,
        resultSymbolMatrix: [],
        currentGamedata: gameData.gameSettings,
        _winData: new WinData(gameInstance),
        currentBet: 0,
        currentLines: 0,
        BetPerLines: 0,
        reels: [],
        lastRedSpin: [],
        lastReSpin: [],
        hasRespin: false,
        freezeIndex: [],
        reSpinWinIndex: []
    };
}

export function generateInitialReel(gameSettings: any): string[][] {
    const reels = [[], [], []];
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

export function sendInitData(gameInstance: SLCM) {
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
