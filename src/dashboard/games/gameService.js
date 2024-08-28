"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesUrl = GamesUrl;
const config_1 = require("../../config/config");
const gameModel_1 = require("./gameModel");
function GamesUrl() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const platform = config_1.config.platformName;
            const platformData = yield gameModel_1.Platform.findOne({ name: platform });
            if (platformData && platformData.games) {
                const gameUrls = platformData.games.map(game => game.url);
                // console.log(gameUrls);
                return gameUrls;
            }
            else {
                console.log('No games found for the specified platform.');
                return [];
            }
        }
        catch (error) {
            console.error('Error fetching platform data:', error);
            return [];
        }
    });
}
