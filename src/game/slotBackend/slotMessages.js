"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotMessages = slotMessages;
const userSocket_1 = require("../../socket/userSocket");
const utils_1 = require("../../utils/utils");
const rtpgenerator_1 = require("../tools/rtpGenerator/rtpgenerator");
const _global_1 = require("./_global");
const slotUtils_1 = require("./slotUtils");
function slotMessages(playerSkt, clientID, message) {
    if (message.id === "checkMoolah") {
        (0, slotUtils_1.checkforMoolah)(playerSkt);
    }
    if (message.id === utils_1.MESSAGEID.SPIN && _global_1.slotGameSettings.startGame) {
        _global_1.slotGameSettings.currentLines = message.data.currentLines;
        _global_1.slotGameSettings.BetPerLines = userSocket_1.betMultiplier[message.data.currentBet];
        _global_1.slotGameSettings.currentBet = userSocket_1.betMultiplier[message.data.currentBet] * _global_1.slotGameSettings.currentLines;
        (0, slotUtils_1.spinResult)(playerSkt, clientID);
    }
    if (message.id == utils_1.MESSAGEID.GENRTP) {
        _global_1.slotGameSettings.currentLines = message.data.currentLines;
        _global_1.slotGameSettings.BetPerLines = userSocket_1.betMultiplier[message.data.currentBet];
        _global_1.slotGameSettings.currentBet = userSocket_1.betMultiplier[message.data.currentBet] * _global_1.slotGameSettings.currentLines;
        (0, rtpgenerator_1.getRTP)(playerSkt, clientID, message.data.spins);
    }
    if (message.id === utils_1.MESSAGEID.GAMBLE) {
    }
}
