"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRTP = getRTP;
const global_1 = require("./global");
function getRTP(client, spins) {
    let moneySpend = 0;
    let moneyWon = 0;
    global_1.getCurrentRTP.playerWon = 0;
    global_1.getCurrentRTP.playerTotalBets = 0;
    for (let i = 0; i < spins; i++) {
        (0, global_1.spinResult)(client);
        moneySpend += global_1.gameSettings.currentBet;
        moneyWon += global_1.gameSettings._winData.totalWinningAmount;
    }
    // Calculate RTP only if moneySpend is not zero to avoid division by zero
    let rtp = 0;
    console.log("Bet : ", global_1.gameSettings.currentBet, "Players Total bet  : ", moneySpend, "Player Won : ", moneyWon);
    if (moneySpend > 0) {
        rtp = (moneyWon / moneySpend); // Use toFixed to limit decimal places
    }
    console.log(global_1.gameSettings.noOfBonus, "bonus");
    console.log(global_1.gameSettings.totalBonuWinAmount, "totalBonus");
    console.log("GENERATED RTP : ", rtp);
    return;
}
