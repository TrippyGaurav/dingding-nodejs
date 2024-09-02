import { currentGamedata } from "../../../Player";
import { RequiredSocketMethods } from "../../Utils/gameUtils";


export default class KenoBaseGame implements RequiredSocketMethods  {
    
     constructor(public currentGameData: currentGamedata) {
       console.log(currentGameData.gameSettings.id);
       
       if(!currentGameData.gameSettings.isSpecial)
       {
        console.log(" Not KENO Special Game ");
         
       }
       else{ 
          console.log("  KENO Special Game ");
         
         
       }
     }

     public initialize(data : any)
     {
        console.log("CHANED PARSHEET IN KENO ");
        
     }
  sendMessage(action: string, message: any) {
    this.currentGameData.sendMessage(action, message);
  }
  sendError(message: string) {
    this.currentGameData.sendError(message);
  }
  sendAlert(message: string) {
    this.currentGameData.sendAlert(message);
  }
  updatePlayerBalance(message: number) {
    this.currentGameData.updatePlayerBalance(message);
  }
  deductPlayerBalance(message: number) {
    this.currentGameData.deductPlayerBalance(message);
  }
  getPlayerData() {
    return this.currentGameData.getPlayerData();
  }

  messageHandler(response: any) {

  }
   
   }