"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const config_1 = require("../../config/config");
// Utility function to extract base origin from URL
const getBaseOrigin = (url) => {
    try {
        const { protocol, hostname, port } = new URL(url);
        return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
    }
    catch (err) {
        return "";
    }
};
const determineOrigin = (req, res, next) => {
    const originHeader = req.get("origin") || req.get("referer") || "";
    const origin = getBaseOrigin(originHeader);
    console.log("Received origin:", origin);
    console.log("Platform URL:", config_1.config.platform_url);
    console.log("CRM URL:", config_1.config.crm_url);
    if (origin === getBaseOrigin(config_1.config.platform_url)) {
        req.isPlayer = true;
    }
    else if (origin === getBaseOrigin(config_1.config.crm_url)) {
        req.isPlayer = false;
    }
    else {
        return next((0, http_errors_1.default)(400, "Invalid origin"));
    }
    next();
};
exports.default = determineOrigin;
