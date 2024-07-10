"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("./userController");
const checkUser_1 = require("../middleware/checkUser");
const userController = new userController_1.UserController();
const userRoutes = express_1.default.Router();
// LOGIN
userRoutes.post("/login", userController.loginUser);
// ADD User
userRoutes.post("/", checkUser_1.checkUser, userController.createUser);
// // GET all details about the current user
userRoutes.get("/", checkUser_1.checkUser, userController.getCurrentUser);
// // GET all subordinates
userRoutes.get("/all", checkUser_1.checkUser, userController.getAllSubordinates);
// GET Report
userRoutes.get("/report", checkUser_1.checkUser, userController.getReport);
// GET a client Report
userRoutes.get("/report/:subordinateId", checkUser_1.checkUser, userController.getASubordinateReport);
// GET a client
userRoutes.get("/:subordinateId", checkUser_1.checkUser, userController.getSubordinateById);
// // DELETE A Client
userRoutes.delete("/:clientId", checkUser_1.checkUser, userController.deleteUser);
// // UPDATE a client
userRoutes.put("/:clientId", checkUser_1.checkUser, userController.updateClient);
exports.default = userRoutes;
