import express from "express";
import { verifyToken } from "../../middleware/tokenAuth";
import { verifyAuth } from "../../middleware/auth";
import {
  addClient,
  clientData,
  companyCreation,
  deleteClient,
  getClientList,
  loginUser,
  updateClientPassword,
  updateClientStatus,
} from "./userController";
const userRoutes = express.Router();

//ALL USERS POST REQUEST
// TODO: Create company 
userRoutes.post("/createCompany", companyCreation);

// TODO : Login
userRoutes.post("/login", loginUser);

// TODO : Add client
userRoutes.post("/addClient", verifyToken, addClient);

// TODO : GET CLIENT LIST
userRoutes.post("/getClientList", getClientList);

// TODO : ALL DELETE REQ FOR USERS
userRoutes.delete("/clients/:username", verifyAuth, deleteClient);

// TODO : ALL PUT REQ FOR USERS
userRoutes.put(
  "/updateClientPassword/:clientUserName",
  verifyToken,
  updateClientPassword
);

// TODO :
userRoutes.put(
  "/clientsStatus/:clientUserName",
  verifyToken,
  updateClientStatus
);

// TODO :

//ALL GET REQ FOR USERS
userRoutes.get("/userData", verifyToken, clientData);

export default userRoutes;
