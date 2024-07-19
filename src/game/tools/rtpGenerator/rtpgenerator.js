"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRTP = getRTP;
const _global_1 = require("../../slotBackend/_global");
const slotUtils_1 = require("../../slotBackend/slotUtils");
function getRTP(playerSkt, client, spins) {
    let moneySpend = 0;
    let moneyWon = 0;
    _global_1.getCurrentRTP.playerWon = 0;
    _global_1.getCurrentRTP.playerTotalBets = 0;
    for (let i = 0; i < spins; i++) {
        (0, slotUtils_1.spinResult)(playerSkt, client);
        moneySpend += _global_1.slotGameSettings.currentBet;
        moneyWon += _global_1.slotGameSettings._winData.totalWinningAmount;
    }
    // Calculate RTP only if moneySpend is not zero to avoid division by zero
    let rtp = 0;
    console.log("Bet : ", _global_1.slotGameSettings.currentBet, "Players Total bet  : ", moneySpend, "Player Won : ", moneyWon);
    if (moneySpend > 0) {
        rtp = (moneyWon / moneySpend); // Use toFixed to limit decimal places
    }
    console.log(_global_1.slotGameSettings.noOfBonus, "bonus");
    console.log(_global_1.slotGameSettings.totalBonuWinAmount, "totalBonus");
    console.log("GENERATED RTP : ", rtp);
    return;
}
