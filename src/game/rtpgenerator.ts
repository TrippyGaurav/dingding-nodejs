import { gameSettings, spinResult } from "./global";
import { CheckResult } from "./slotResults";

export function getRTP(client: string, spins: number) {
  let moneySpend: number = 0;
  let moneyWon: number = 0;

  for (let i = 0; i < spins; i++) {
    spinResult(client);
    moneySpend += gameSettings.currentBet;
    moneyWon += gameSettings._winData.totalWinningAmount;
  }

  // Calculate RTP only if moneySpend is not zero to avoid division by zero
  let rtp = 0;


  console.log(
    "Bet : ",
    gameSettings.currentBet,
    "Players Total bet  : ",
    moneySpend,
    "Player Won : ",
    moneyWon
  );
  if (moneySpend > 0) {
    rtp = (moneyWon / moneySpend); // Use toFixed to limit decimal places
  }
  console.log("GENERATED RTP : ", rtp);

  return;
}