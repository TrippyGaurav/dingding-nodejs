import express from "express";
import { extractRoleFromCookie } from "../middleware/middlware";
import {
  createUser,
  loginUser,
  deleteClient,
  updateClient,
  getClientsOfClient,
  getAllSubordinates,
  getSubordinateById,
  getCurrentUser,
} from "./userController";
import { checkUser } from "../middleware/checkUser";

const userRoutes = express.Router();

// LOGIN
userRoutes.post("/login", loginUser);

// ADD User
userRoutes.post("/", checkUser, createUser);

// // GET all details about the current user
userRoutes.get("/", checkUser, getCurrentUser);

// // GET all subordinates
userRoutes.get("/all", extractRoleFromCookie, getAllSubordinates);

// // GET all details of a particular user
userRoutes.get("/:subordinateId", checkUser, getSubordinateById);

// // DELETE A Client
userRoutes.delete("/:clientId", extractRoleFromCookie, deleteClient);

// // UPDATE a client
userRoutes.put("/:clientId", extractRoleFromCookie, updateClient);

// // FOR COMPANY
// // GET clients of user by userId
userRoutes.get("/:clientId/clients", extractRoleFromCookie, getClientsOfClient);

export default userRoutes;
