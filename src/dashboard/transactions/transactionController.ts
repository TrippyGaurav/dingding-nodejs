import { Request, Response, NextFunction } from "express";
import { User } from "../users/userModel";
import Transaction from "./transactionModel";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { AuthRequest } from "../../utils/utils";
import { IPlayer, IUser } from "../users/userType";
import { ITransaction } from "./transactionType";
import TransactionService from "./transactionService";

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
    this.getTransactions = this.getTransactions.bind(this);
    this.getTransactionsBySubId = this.getTransactionsBySubId.bind(this);
    this.deleteTransaction = this.deleteTransaction.bind(this);
    this.getAllTransactions = this.getAllTransactions.bind(this)
  }

  /**
   * Creates a new transaction.
   */
  async createTransaction(type: string, debtor: IUser, creditor: IUser | IPlayer, amount: number, session: mongoose.ClientSession): Promise<ITransaction> {
    try {
      const transaction = await this.transactionService.createTransaction(type, debtor, creditor, amount, session);
      console.log(`Transaction created: ${transaction._id}`);
      return transaction;
    } catch (error) {
      console.error(`Error creating transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves transactions for the authenticated user.
   */
  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;

      const transactions = await this.transactionService.getTransactions(username);
      res.status(200).json(transactions)
    } catch (error) {
      console.error(`Error fetching transactions: ${error.message}`);
      next(error);
    }
  }

  /**
   * Retrieves transactions for a specific client.
   */
  async getTransactionsBySubId(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;
      const { subordinateId } = req.params;

      const user = await User.findOne({ username });
      const subordinate = await User.findOne({ _id: subordinateId });

      if (!user) {
        throw createHttpError(404, "Unable to find logged in user");
      }

      if (!subordinate) {
        throw createHttpError(404, "User not found");
      }

      if (user.role === "company" || user.subordinates.includes(new mongoose.Types.ObjectId(subordinateId))) {
        const transactions = await this.transactionService.getTransactionsBySubName(subordinate.username)
        res.status(200).json(transactions);
      }
      else {
        throw createHttpError(403, "Forbidden: You do not have the necessary permissions to access this resource.");
      }

    } catch (error) {
      console.error(`Error fetching transactions by client ID: ${error.message}`);
      next(error);
    }
  }

  /**
   * Retrieves All transactions
   */
  async getAllTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;

      if (role != "company") {
        throw createHttpError(403, "Access denied. Only users with the role 'company' can access this resource.");
      }

      const transactions = await Transaction.find()
      res.status(200).json(transactions)

    } catch (error) {
      console.error(`Error fetching transactions by client ID: ${error.message}`);
      next(error);
    }
  }


  /**
   * Deletes a transaction.
   */
  async deleteTransaction(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createHttpError(400, "Invalid transaction ID");
      }

      const deletedTransaction = await this.transactionService.deleteTransaction(id, session);
      if (deletedTransaction instanceof mongoose.Query) {
        const result = await deletedTransaction.lean().exec();
        if (!result) {
          throw createHttpError(404, "Transaction not found");
        }
        res.status(200).json({ message: "Transaction deleted successfully" });
        console.log(`Transaction deleted: ${id}`);
      } else {
        if (!deletedTransaction) {
          throw createHttpError(404, "Transaction not found");
        }
        res.status(200).json({ message: "Transaction deleted successfully" });
        console.log(`Transaction deleted: ${id}`);
      }
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error(`Error deleting transaction: ${error.message}`);
      next(error);
    }
  }
}

