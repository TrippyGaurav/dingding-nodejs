"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultType = exports.bonusGameType = exports.specialIcons = void 0;
var specialIcons;
(function (specialIcons) {
    specialIcons["bonus"] = "Bonus";
    specialIcons["scatter"] = "Scatter";
    specialIcons["jackpot"] = "Jackpot";
    specialIcons["wild"] = "Wild";
    specialIcons["any"] = "any";
})(specialIcons || (exports.specialIcons = specialIcons = {}));
var bonusGameType;
(function (bonusGameType) {
    bonusGameType["tap"] = "tap";
    bonusGameType["spin"] = "spin";
    bonusGameType["default"] = "default";
})(bonusGameType || (exports.bonusGameType = bonusGameType = {}));
var ResultType;
(function (ResultType) {
    ResultType["moolah"] = "moolah";
    ResultType["normal"] = "normal";
})(ResultType || (exports.ResultType = ResultType = {}));
