import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import socketController from "./socket/controller";
import globalErrorHandler from "./dashboard/middleware/globalHandler";
import companyRoutes from "./dashboard/company/companyRoutes";
import userRoutes from "./dashboard/users/userRoutes";
import transactionRoutes from "./dashboard/transactions/transactionRoutes";
import gameRoutes from "./dashboard/games/gameRoutes";


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
app.use(
  cors({
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
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


app.use("/api/company", companyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/games", gameRoutes);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

socketController(io);

app.use(globalErrorHandler);

export default server;
