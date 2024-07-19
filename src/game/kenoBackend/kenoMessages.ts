import { kenoCurrentGameData } from "./_global"
import { defaultPayoutTable, play as playKeno } from "./keno.";

export function kenoMessages(message: any, clientID: any) {
   if (message.id == "PLAY") {
      kenoCurrentGameData.currentBet = message.data.CURRENTBET;
      kenoCurrentGameData.currentSelectedNumbers = message.data.SELECTEDNUMBERS;
      playKeno(message.data.SELECTEDNUMBERS.length, defaultPayoutTable);
   }
}