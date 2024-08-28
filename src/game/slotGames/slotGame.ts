import { currentGamedata } from "../../Player";
import BaseSlotGame from "./BaseSlotGame/BaseSlotGame";

interface RequiredSocketMethods {
  sendMessage(action: string, message: any): void;
  sendError(error: string): void;
  sendAlert(alert: string): void;
  messageHandler(data: any): void;
  updatePlayerBalance(amount: number): void;
  deductPlayerBalance(amount: number): void;
}

export default class SlotGameManager  {
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