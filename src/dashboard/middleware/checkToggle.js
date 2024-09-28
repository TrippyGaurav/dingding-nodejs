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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkToggle = void 0;
const ToggleModel_1 = __importDefault(require("../Toggle/ToggleModel"));
const checkToggle = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const toggle = yield ToggleModel_1.default.findOne();
        if (toggle === null || toggle === void 0 ? void 0 : toggle.availableAt) {
            const now = new Date();
            const availableAt = new Date(toggle.availableAt);
            // Check if the current time is before the 'availableAt' time
            if (now < availableAt) {
                return res.status(503).json({ message: `Under Maintenance until ${availableAt}` });
            }
            // If the time has passed, reset 'availableAt' to null
            toggle.availableAt = null;
            yield toggle.save();
        }
        next(); // Proceed if the service is available
    }
    catch (error) {
        return res.status(500).json({ message: 'Error checking service status' });
    }
});
exports.checkToggle = checkToggle;
