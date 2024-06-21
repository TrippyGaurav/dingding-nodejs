import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import socketController from "./socket/controller";
import userRoutes from "./dashboard/user/userRoutes";
import transactionRoutes from "./dashboard/transaction/transactionRoutes";
import Games from "./dashboard/casinoGames/gamesRoutes";
import globalErrorHandler from "./middleware/globalHandler";
import companyRoutes from "./company/companyRoutes";
import clientRoutes from "./client/clientRoutes";

const app = express();

//Cloudinary configs
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
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

// NEW
app.use("/api/company", companyRoutes);
app.use("/api/clients", clientRoutes);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

socketController(io);

app.use(globalErrorHandler);

export default server;
