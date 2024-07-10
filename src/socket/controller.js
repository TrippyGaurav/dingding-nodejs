"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userSocket_1 = require("./userSocket");
const socketController = (io) => {
    io.use((socket, next) => {
        console.log("I'm Socket middleware");
        next();
    });
    io.on("connection", (socket) => {
        io.emit("newConnectionAlert", "A new user has connected!");
        (0, userSocket_1.initializeUser)(socket);
    });
};
exports.default = socketController;
