"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const playerSocket_1 = __importDefault(require("../playerSocket"));
const socketController = (io) => {
    io.use((socket, next) => {
        console.log("I'm Socket middleware");
        next();
    });
    io.on("connection", (socket) => {
        io.emit("newConnectionAlert", "A new user has connected!");
        (0, playerSocket_1.default)(socket);
    });
};
exports.default = socketController;
