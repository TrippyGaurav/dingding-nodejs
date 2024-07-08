import express from "express";
import { extractRoleFromCookie } from "../middleware/middlware";
import {
  TransactionController,
  // getTransactionsByClientId,
} from "./transactionController";
import { checkUser } from "../middleware/checkUser";

const transactionController = new TransactionController()
const transactionRoutes = express.Router();

transactionRoutes.get("/", checkUser, transactionController.getTransactions);
transactionRoutes.get(
  "/:clientId",
  extractRoleFromCookie,
  // getTransactionsByClientId
);

export default transactionRoutes;
// 