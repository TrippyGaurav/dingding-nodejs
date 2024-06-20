import express from "express";
import { verifyToken } from "../../middleware/tokenAuth";
import { verifyAuth } from "../../middleware/auth";
import {
  addClient,
  clientData,
  companyCreation,
  createUser,
  deleteClient,
  getClientList,
  loginUser,
  updateClientPassword,
  updateClientStatus,
} from "./userController";
import { extractRoleFromCookie } from "../../middleware/middlware";
const userRoutes = express.Router();

//ALL USERS POST REQUEST
userRoutes.post("/createCompany", companyCreation);
userRoutes.post("/login", loginUser);
userRoutes.post("/addClient", verifyToken, addClient);
userRoutes.post("/getClientList", getClientList);

//ALL DELETE REQ FOR USERS
userRoutes.delete("/clients/:username", verifyAuth, deleteClient);

//ALL PUT REQ FOR USERS
userRoutes.put(
  "/updateClientPassword/:clientUserName",
  verifyToken,
  updateClientPassword
);
userRoutes.put(
  "/clientsStatus/:clientUserName",
  verifyToken,
  updateClientStatus
);

//ALL GET REQ FOR USERS
userRoutes.get("/userData", verifyToken, clientData);

// NEW
userRoutes.post("/", extractRoleFromCookie, createUser);
userRoutes.get("/", (req, res) => {
  res.json({ message: "Hi" });
});

export default userRoutes;
