import express from "express";
import { extractRoleFromCookie } from "../middleware/middlware";
import {
  createUser,
  getUsers,
  getClientsOfUser,
  loginUser,
  deleteClient,
  updateClient,
} from "./userController";

const userRoutes = express.Router();

// LOGIN
userRoutes.post("/login", loginUser);

// ADD User
userRoutes.post("/", extractRoleFromCookie, createUser);

// GET Users
userRoutes.get("/", extractRoleFromCookie, getUsers);

// GET clients of user
userRoutes.get("/:username", extractRoleFromCookie, getClientsOfUser);

// DELETE A Client
userRoutes.delete("/:clientId", extractRoleFromCookie, deleteClient);

// UPDATE a client
userRoutes.put("/:clientId", extractRoleFromCookie, updateClient);

export default userRoutes;
