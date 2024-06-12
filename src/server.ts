import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import socketController from "./socket/controller";
import userRoutes from "./dashboard/user/userRoutes";
import transactionRoutes from "./dashboard/transaction/transactionRoutes";
import bodyParser from "body-parser";

import Games from "./dashboard/casinoGames/gamesRoutes";
const app = express();
const corsOptions = {
  origin: [
    "*",
    "http://192.168.1.26:5173",
    "http://localhost:5000",
    "http://localhost:3000",
    "https://game-crm-backend-r32s.onrender.com",
    "https://milkyway-platform.vercel.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true,limit:"25mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});
const server = createServer(app);

// HEALTH ROUTES
app.get("/", (req, res, next) => {
  const health = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: new Date().toLocaleDateString(),
  };
  res.status(200).json(health);
});

//OTHER ROUTES
app.use("/api/users", userRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/games", Games);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

socketController(io);

export default server;
