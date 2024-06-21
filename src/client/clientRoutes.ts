import express from "express";
import { extractRoleFromCookie } from "../middleware/middlware";
import {
  createClient,
  getClients,
  getUsersOfClient,
  loginClient,
} from "./clientController";
const clientRoutes = express.Router();

// LOGIN
clientRoutes.post("/login", loginClient);

// ADD CLIENT
clientRoutes.post("/", extractRoleFromCookie, createClient);

// GET CLIENTS
clientRoutes.get("/", extractRoleFromCookie, getClients);

// GET USERS of CLIENT
clientRoutes.post("/:client", extractRoleFromCookie, getUsersOfClient);

export default clientRoutes;
