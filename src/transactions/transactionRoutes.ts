import express from "express";
import { extractRoleFromCookie } from "../middleware/middlware";
import {
  getTransactions,
  getTransactionsByClientId,
} from "./transactionController";

const transactionRoutes = express.Router();

transactionRoutes.get("/", extractRoleFromCookie, getTransactions);
transactionRoutes.get(
  "/:clientId",
  extractRoleFromCookie,
  getTransactionsByClientId
);

export default transactionRoutes;
