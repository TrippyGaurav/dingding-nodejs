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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const globalHandler_1 = __importDefault(require("./dashboard/middleware/globalHandler"));
const companyRoutes_1 = __importDefault(require("./dashboard/company/companyRoutes"));
const userRoutes_1 = __importDefault(require("./dashboard/users/userRoutes"));
const transactionRoutes_1 = __importDefault(require("./dashboard/transactions/transactionRoutes"));
const gameRoutes_1 = __importDefault(require("./dashboard/games/gameRoutes"));
const svg_captcha_1 = __importDefault(require("svg-captcha"));
const http_errors_1 = __importDefault(require("http-errors"));
const socket_1 = __importDefault(require("./socket"));
const checkAdmin_1 = require("./dashboard/middleware/checkAdmin");
const payoutRoutes_1 = __importDefault(require("./dashboard/payouts/payoutRoutes"));
const checkUser_1 = require("./dashboard/middleware/checkUser");
const gameService_1 = require("./dashboard/games/gameService");
const app = (0, express_1.default)();
//Cloudinary configs
app.use(express_1.default.json({ limit: "25mb" }));
app.use(express_1.default.urlencoded({ limit: "25mb", extended: true }));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
// CORS config
const staticAllowedOrigins = [
    'https://www.milkyway-casino.com',
    'https://crm.milkyway-casino.com',
    'https://dev.casinoparadize.com',
    'http://localhost:5000',
    'http://localhost:3001',
    'https://7p68wzhv-5000.inc1.devtunnels.ms/'
];
app.use((req, res, next) => {
    (0, cors_1.default)({
        origin: (origin, callback) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const gameUrls = yield (0, gameService_1.GamesUrl)();
                const allowedOrigins = [...staticAllowedOrigins, ...gameUrls];
                if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(req.headers.host)) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Not allowed by CORS'));
                }
            }
            catch (error) {
                callback(new Error('Error in CORS validation'));
            }
        }),
        credentials: true,
        optionsSuccessStatus: 200,
    })(req, res, next);
});
const server = (0, http_1.createServer)(app);
// HEALTH ROUTES
app.get("/", (req, res, next) => {
    const health = {
        uptime: process.uptime(),
        message: "OK",
        timestamp: new Date().toLocaleDateString(),
    };
    res.status(200).json(health);
});
app.get("/captcha", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        var captcha = svg_captcha_1.default.create();
        if (captcha) {
            req.session.captcha = captcha.text;
            res.status(200).json(captcha.data);
        }
        else {
            throw (0, http_errors_1.default)(404, "Error Generating Captcha, Please refresh!");
        }
    }
    catch (error) {
        next(error);
    }
}));
app.use("/api/company", companyRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/transactions", transactionRoutes_1.default);
app.use("/api/games", gameRoutes_1.default);
app.use("/api/payouts", checkUser_1.checkUser, checkAdmin_1.checkAdmin, payoutRoutes_1.default);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
(0, socket_1.default)(io);
app.use(globalHandler_1.default);
exports.default = server;
