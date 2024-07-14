import { betMultiplier } from "../../socket/userSocket";
import { MESSAGEID } from "../../utils/utils";
import { getRTP } from "../tools/rtpGenerator/rtpgenerator";
import { slotGameSettings } from "./_global";
import { checkforMoolah, spinResult } from "./slotUtils";


export function slotMessages(message : any)
{
    if (message.id === "checkMoolah") {
        checkforMoolah();
      }
      if (message.id === MESSAGEID.SPIN && slotGameSettings.startGame) {
        slotGameSettings.currentLines = message.data.currentLines;
        slotGameSettings.BetPerLines = betMultiplier[message.data.currentBet];
        slotGameSettings.currentBet = betMultiplier[message.data.currentBet] * slotGameSettings.currentLines;

        spinResult(this.socket.id);
      }
      if (message.id == MESSAGEID.GENRTP) {
        slotGameSettings.currentLines = message.data.currentLines;
        slotGameSettings.BetPerLines = betMultiplier[message.data.currentBet];
        slotGameSettings.currentBet = betMultiplier[message.data.currentBet] * slotGameSettings.currentLines;

        getRTP(this.socket.id, message.data.spins);
      }

      if (message.id === MESSAGEID.GAMBLE) {
      }
}