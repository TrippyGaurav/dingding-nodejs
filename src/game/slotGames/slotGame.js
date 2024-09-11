"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseSlotGame_1 = __importDefault(require("./BaseSlotGame/BaseSlotGame"));
const cashMachineBase_1 = require("./SL-CM/cashMachineBase");
const crazy777Base_1 = require("./SL-CRZ/crazy777Base");
class SlotGameManager {
    constructor(currentGameData) {
        // console.log("Requesting Game : ",currentGameData.gameSettings.id);
        this.currentGameData = currentGameData;
        this.gameClassMapping = {
            "SL-CM": cashMachineBase_1.SLCM, "SL-CRZ": crazy777Base_1.SLCRZ,
        };
        const slotGameClass = this.gameClassMapping[currentGameData.gameSettings.id];
        if (slotGameClass) {
            this.currentGame = new slotGameClass(currentGameData);
        }
        else {
            this.currentGame = new BaseSlotGame_1.default(currentGameData);
            // throw new Error(`No game class found for id: ${currentGameData.gameSettings.id}`);
        }
    }
}
exports.default = SlotGameManager;
