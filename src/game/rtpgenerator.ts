import { gameSettings } from "./global";
import { CheckResult } from "./slotResults";

export function getRTP(client: string) {
  let moneySpend: number = 0;
  let moneyWon: number = 0;

  for (let i = 0; i < 100; i++) {
    const resultData = new CheckResult(client);
    moneySpend += gameSettings.currentBet;
    moneyWon += resultData.winData.totalWinningAmount;
  }

  console.log(
    "Bet : ",
    gameSettings.currentBet,
    " Players Total bet  : ",
    moneySpend,
    " Player Won : ",
    moneyWon
  );

  console.log("GENERATED RTP : ", (moneyWon / moneySpend) * 100);
  return;
}
