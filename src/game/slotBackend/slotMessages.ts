import { Socket } from "socket.io";
import { betMultiplier } from "../../socket/userSocket";
import { MESSAGEID } from "../../utils/utils";
import { getRTP } from "../tools/rtpGenerator/rtpgenerator";
import { slotGameSettings } from "./_global";
import { checkforMoolah, spinResult } from "./slotUtils";


export function slotMessages(playerSkt : Socket,message : any)
{
    if (message.id === "checkMoolah") {
        checkforMoolah(playerSkt);
      }
      if (message.id === MESSAGEID.SPIN && slotGameSettings.startGame) {
        slotGameSettings.currentLines = message.data.currentLines;
        slotGameSettings.BetPerLines = betMultiplier[message.data.currentBet];
        slotGameSettings.currentBet = betMultiplier[message.data.currentBet] * slotGameSettings.currentLines;

        spinResult(playerSkt,this.socket.id);
      }
      if (message.id == MESSAGEID.GENRTP) {
        slotGameSettings.currentLines = message.data.currentLines;
        slotGameSettings.BetPerLines = betMultiplier[message.data.currentBet];
        slotGameSettings.currentBet = betMultiplier[message.data.currentBet] * slotGameSettings.currentLines;

        getRTP(playerSkt,this.socket.id, message.data.spins);
      }

      if (message.id === MESSAGEID.GAMBLE) {
      }
}