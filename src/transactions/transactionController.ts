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

  constructor(){
    this.transactionService = new TransactionService();
    this.getTransactions = this.getTransactions.bind(this)
  }

  async createTransaction(type:string, debtor:IUser, creditor: IUser | IPlayer, amount:number, session:mongoose.ClientSession):Promise<ITransaction>{
    return await this.transactionService.createTransaction(type, debtor, creditor, amount, session);
  }

  async getTransactions(req:Request, res:Response, next:NextFunction){
    try {
      const _req = req as AuthRequest;
      const {username, role} = _req.user;

      const transactions = await this.transactionService.getTransactions(username, role);
      res.status(200).json(transactions);
    } catch (error) {
      next(error)
    }
  }

  async getTransactionsByClientId(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const {username, role} = _req.user;
      const { clientId } = req.params;
      

      const transactions = await this.transactionService.getTransactionsByClientId(clientId, username, role);

      res.status(200).json(transactions);
    } catch (error) {
      next(error);
    }
  }
}



// Get Transaction By id
export const getTransactionsByClientId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clientId } = req.params;
    const { creatorUsername, creatorRole } = req.body;

    // Validate input
    if (!clientId) {
      throw createHttpError(400, "Client Id is required");
    }
    if (!creatorUsername || !creatorRole) {
      throw createHttpError(403, "Unable to verify the creator");
    }

    // Convert clientId to ObjectId
    const clientObjectId = new mongoose.Types.ObjectId(clientId);

    // Check if creator exists
    const creator = await User.findOne({ username: creatorUsername });
    if (!creator) {
      throw createHttpError(404, "Creator not found");
    }

    // Check if client exists
    const client = await User.findById(clientObjectId).populate("transactions");
    if (!client) {
      throw createHttpError(404, "Client not found");
    }

    // Check if client is in creator's clients list
    if (!creator.subordinates.includes(clientObjectId)) {
      throw createHttpError(
        403,
        "Access denied: Client is not in your clients list"
      );
    }

    // Return the client's transactions
    res.status(200).json(client.transactions);
  } catch (error) {
    next(error);
  }
};

// Delete a transaction
export const deleteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(id).session(
      session
    );
    if (!deletedTransaction) {
      throw new Error("Transaction not found");
    }

    // Remove transaction from users' transactions array
    await User.updateMany(
      { transactions: id },
      { $pull: { transactions: id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
