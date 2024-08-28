import { currentGamedata } from "../../Player";
import BaseSlotGame from "./BaseSlotGame/BaseSlotGame";
import { SLCM } from "./SL-CM/cashMachineBase";

export default class SlotGameManager  {
 public currentGame : any;

  gameClassMapping: { [key: string]: any } = {
  "SL-CM": SLCM,
};

  constructor(public currentGameData: currentGamedata) {
    console.log(currentGameData.gameSettings.id);
    
    if(!currentGameData.gameSettings.isSpecial)
    {
      this.currentGame = new BaseSlotGame(currentGameData);
    }
    else{
      console.log("Special Game Slot ");
      const slotGameClass = this.gameClassMapping[currentGameData.gameSettings.id];
    
      if (slotGameClass) {
        this.currentGame = new slotGameClass(currentGameData);
      } else {
        throw new Error(`No game class found for id: ${currentGameData.gameSettings.id}`);
      }
    }
    }
  

}
