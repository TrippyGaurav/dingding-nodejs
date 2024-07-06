import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import socketController from "./socket/controller";
import globalErrorHandler from "./middleware/globalHandler";
import companyRoutes from "./company/companyRoutes";
import userRoutes from "./users/userRoutes";
import transactionRoutes from "./transactions/transactionRoutes";
import gameRoutes from "./games/gameRoutes";
import session from "express-session"
import { config } from "./config/config";
import svgCaptcha from "svg-captcha";
import createHttpError from "http-errors";

declare module "express-session" {
  interface Session {
    captcha?: string;
  }
}

const app = express();

app.use(
  session({
    secret: config.jwtSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: config.env === "development" ? false : true,
      maxAge: 86400000,
    },
  })
);

//Cloudinary configs
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
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

app.get("/captcha", async (req: Request, res: Response, next: NextFunction) => {
  try {
    var captcha = svgCaptcha.create();
    if (captcha) {
      req.session.captcha = captcha.text;
      res.status(200).json(captcha.data);
    } else {
      throw createHttpError(404, "Error Generating Captcha, Please refresh!");
    }
  } catch (error) {
    next(error);
  }
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
