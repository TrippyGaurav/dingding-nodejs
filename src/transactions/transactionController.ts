import { Request, Response, NextFunction } from "express";
import { User } from "../users/userModel";
import Transaction from "./transactionModel";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { AuthRequest } from "../utils/utils";
import { IPlayer, IUser } from "../users/userType";
import { ITransaction } from "./transactionType";
import TransactionService from "./transactionService";

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
    this.getTransactions = this.getTransactions.bind(this);
    this.getTransactionsByClientId = this.getTransactionsByClientId.bind(this);
    this.deleteTransaction = this.deleteTransaction.bind(this);
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

      const transactions = await this.transactionService.getTransactions(username, role);
      if (transactions instanceof mongoose.Query) {
        const result = await transactions.lean().exec();
        res.status(200).json(result);
      } else {
        res.status(200).json(transactions);
      }
    } catch (error) {
      console.error(`Error fetching transactions: ${error.message}`);
      next(error);
    }
  }

  /**
   * Retrieves transactions for a specific client.
   */
  async getTransactionsByClientId(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;
      const { clientId } = req.params;

      // Validate clientId
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        throw createHttpError(400, "Invalid clientId");
      }

      const transactions = await this.transactionService.getTransactionsByClientId(clientId, username, role);
      if (transactions instanceof mongoose.Query) {
        const result = await transactions.lean().exec();
        res.status(200).json(result);
      } else {
        res.status(200).json(transactions);
      }
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

// Ensure indexes are created for performance
Transaction.createIndexes();

// Exporting an instance of the controller
const transactionController = new TransactionController();
export default transactionController;
