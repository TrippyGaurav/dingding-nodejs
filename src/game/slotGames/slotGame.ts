import { GameSettings } from "../../dashboard/games/gameType";
import { currentGamedata, playerData } from "../../Player";
import { betMultiplier, UiInitData, convertSymbols, specialIcons, bonusGameType, shuffleArray, ResultType } from "../Utils/gameUtils";
import { combineUniqueSymbols, removeRecurringIndexSymbols, cascadeMoveTowardsNull, transposeMatrix } from "../Utils/SlotUtils";
import { RandomResultGenerator } from "./RandomResultGenerator";
import { WinData } from "./BaseSlotGame/WinData";
import { BonusGame } from "./BaseSlotGame/BonusGame";
import { CheckResult } from "./BaseSlotGame/CheckResult";
import { gambleCardGame } from "./BaseSlotGame/newGambleGame";
import {gameData } from "./testData"
import BaseSlotGame from "./BaseSlotGame/BaseGlobal";




export default class SlotGame  {
 public currentGame : any;

  constructor(public currentGameData: currentGamedata) {
    console.log(currentGameData.gameSettings.id);
    
    if(!currentGameData.gameSettings.isSpecial)
    {
      this.currentGame = new BaseSlotGame(currentGameData);
    }
    else{
      console.log("Special Game Slot ");
      
    }
  }

}