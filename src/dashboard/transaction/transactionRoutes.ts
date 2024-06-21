import express from "express";
import { verifyToken } from "../../middleware/tokenAuth";
import { transactions, transferCredits } from "./transactionController";
import { authenticateToken } from "../../middleware/authenticateToken";
import { extractRoleFromCookie } from "../../middleware/middlware";

const transactionRoutes = express.Router();

transactionRoutes.post("/", authenticateToken, transferCredits);
//ALL GET REQ FOR USERS
transactionRoutes.get("/", authenticateToken, transactions);
export default transactionRoutes;
