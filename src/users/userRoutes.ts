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



// // DELETE A Client
userRoutes.delete("/:clientId", checkUser, userController.deleteUser);

// // UPDATE a client
userRoutes.put("/:clientId", checkUser, userController.updateClient);

// GET a client
userRoutes.get("/:subordinateId", checkUser, userController.getSubordinateById);

// // GET clients of user by userId
// userRoutes.get("/:subordinateId/subordinates", checkUser, userController.getUserSubordinates);

export default userRoutes;
