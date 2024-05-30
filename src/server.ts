import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import socketHandler from "./socket/handler";
import socketMiddleware from "./socket/middleware";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.use(socketMiddleware);
socketHandler(io);

export default server;
