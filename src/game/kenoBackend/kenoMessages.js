"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kenoMessages = kenoMessages;
const _global_1 = require("./_global");
const keno_1 = require("./keno");
function kenoMessages(message, clientID) {
    if (message.id == "PLAY") {
        _global_1.kenoCurrentGameData.currentBet = message.data.CURRENTBET;
        _global_1.kenoCurrentGameData.currentSelectedNumbers = message.data.SELECTEDNUMBERS;
        (0, keno_1.play)(message.data.SELECTEDNUMBERS.length, keno_1.defaultPayoutTable);
    }
}
