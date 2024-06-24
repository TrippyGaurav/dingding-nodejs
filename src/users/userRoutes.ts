import express from "express";
import { extractRoleFromCookie } from "../middleware/middlware";
import {
  createUser,
  loginUser,
  deleteClient,
  updateClient,
  getClientsOfClient,
  getCurrentUserDetails,
  getClientDetails,
  getAllClients,
} from "./userController";

const userRoutes = express.Router();

// LOGIN
userRoutes.post("/login", loginUser);

// ADD User
userRoutes.post("/", extractRoleFromCookie, createUser);

// GET all details about the current user
userRoutes.get("/", extractRoleFromCookie, getCurrentUserDetails);

// GET all details of a particular user
userRoutes.get("/:clientId", extractRoleFromCookie, getClientDetails);

// GET all clients
userRoutes.get("/all", extractRoleFromCookie, getAllClients);

// DELETE A Client
userRoutes.delete("/:clientId", extractRoleFromCookie, deleteClient);

// UPDATE a client
userRoutes.put("/:clientId", extractRoleFromCookie, updateClient);

// FOR COMPANY
// GET clients of user by userId
userRoutes.get("/:clientId/clients", extractRoleFromCookie, getClientsOfClient);

export default userRoutes;
