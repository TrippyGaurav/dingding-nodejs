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
import determineOrigin from "../middleware/determineOrigin";

const userRoutes = express.Router();

// LOGIN
userRoutes.post("/login", loginUser);

// ADD User
userRoutes.post("/", extractRoleFromCookie, createUser);

// // GET all clients
userRoutes.get("/all", extractRoleFromCookie, getAllClients);

// // GET all details about the current user
userRoutes.get(
  "/",
  determineOrigin,
  extractRoleFromCookie,
  getCurrentUserDetails
);

// // GET all details of a particular user
userRoutes.get("/:clientId", extractRoleFromCookie, getClientDetails);

// // DELETE A Client
userRoutes.delete("/:clientId", extractRoleFromCookie, deleteClient);

// // UPDATE a client
userRoutes.put("/:clientId", extractRoleFromCookie, updateClient);

// // FOR COMPANY
// // GET clients of user by userId
userRoutes.get("/:clientId/clients", extractRoleFromCookie, getClientsOfClient);

export default userRoutes;
