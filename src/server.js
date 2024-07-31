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
const express_session_1 = __importDefault(require("express-session"));
const config_1 = require("./config/config");
const svg_captcha_1 = __importDefault(require("svg-captcha"));
const http_errors_1 = __importDefault(require("http-errors"));
const socket_1 = __importDefault(require("./socket"));
const checkAdmin_1 = require("./dashboard/middleware/checkAdmin");
const payoutRoutes_1 = __importDefault(require("./dashboard/payouts/payoutRoutes"));
const checkUser_1 = require("./dashboard/middleware/checkUser");
const app = (0, express_1.default)();
app.use((0, express_session_1.default)({
    secret: config_1.config.jwtSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: config_1.config.env === "development" ? false : true,
        maxAge: 86400000,
    },
}));
//Cloudinary configs
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
const allowedOrigins = ['http://localhost:3000', 'https://game-rtp-backend-w7g7.onrender.com'];
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
//cors config
app.use((0, cors_1.default)({
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200,
}));
app.use(express_1.default.json());
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
