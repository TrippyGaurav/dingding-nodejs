import express from "express";
import { extractRoleFromCookie } from "../middleware/middlware";
import {
  UserController,
} from "./userController";
import { checkUser } from "../middleware/checkUser";

const userController = new UserController()
const userRoutes = express.Router();

// LOGIN
userRoutes.post("/login", userController.loginUser);

// ADD User
userRoutes.post("/", checkUser, userController.createUser);

// // GET all details about the current user
userRoutes.get("/", checkUser, userController.getCurrentUser);

// // GET all subordinates
userRoutes.get("/all", checkUser, userController.getAllSubordinates);

// // GET all details of a particular user
userRoutes.get("/:subordinateId", checkUser, userController.getSubordinateById);

// // DELETE A Client
userRoutes.delete("/:clientId", checkUser, userController.deleteUser);

// // UPDATE a client
userRoutes.put("/:clientId", checkUser, userController.updateClient);

// // FOR COMPANY
// // GET clients of user by userId
userRoutes.get("/:clientId/clients", checkUser, userController.getClientsOfClient);

export default userRoutes;
