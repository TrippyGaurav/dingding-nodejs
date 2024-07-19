
import { Socket } from "socket.io";
import { slotGameSettings, getCurrentRTP} from "../../slotBackend/_global";
import { CheckResult } from "../../slotBackend/slotResults";
import { spinResult } from "../../slotBackend/slotUtils";

export function getRTP(playerSkt : Socket, client: string, spins: number) {
  let moneySpend: number = 0;
  let moneyWon: number = 0;
  getCurrentRTP.playerWon = 0;
  getCurrentRTP.playerTotalBets = 0;
  for (let i = 0; i < spins; i++) {

    spinResult(playerSkt,client);
    moneySpend += slotGameSettings.currentBet;
    moneyWon += slotGameSettings._winData.totalWinningAmount;
  }

  // Calculate RTP only if moneySpend is not zero to avoid division by zero
  let rtp = 0;


  console.log(
    "Bet : ",
    slotGameSettings.currentBet,
    "Players Total bet  : ",
    moneySpend,
    "Player Won : ",
    moneyWon
  );
  if (moneySpend > 0) {
    rtp = (moneyWon / moneySpend); // Use toFixed to limit decimal places
  }
  console.log(slotGameSettings.noOfBonus, "bonus")
  console.log(slotGameSettings.totalBonuWinAmount, "totalBonus")
  console.log("GENERATED RTP : ", rtp);

  return;
}