import mongoose from "mongoose";
import { ITransaction } from "./transactionType";
import { rolesHierarchy } from "../utils/utils";
import createHttpError from "http-errors";
import Transaction from "./transactionModel";
import { User } from "../users/userModel";

export class TransactionService {
    async createTransaction(type: string, manager: any, client: any, amount: number, session: mongoose.ClientSession
    ): Promise<ITransaction> {
      if (!rolesHierarchy[manager.role]?.includes(client.role)) {
        throw createHttpError(
          403,
          `${manager.role} cannot perform transactions with ${client.role}`
        );
      }
  
      if (type === "recharge") {
        if (manager.credits < amount) {
          throw createHttpError(400, "Insufficient credits to recharge");
        }
  
        client.credits += amount;
        client.totalRecharged += amount;
        manager.credits -= amount;
      } else if (type === "redeem") {
        if (client.credits < amount) {
          throw createHttpError(400, "Client has insufficient credits to redeem");
        }
        client.credits -= amount;
        client.totalRedeemed += amount;
        manager.credits += amount;
      }
  
      const transaction = new Transaction({
        debtor: type === "recharge" ? manager.username : client.username,
        creditor: type === "recharge" ? client.username : manager.username,
        type: type,
        amount: amount,
        createdAt: new Date(),
      });
  
      await transaction.save({ session });
  
      return transaction;
    }
  
    async getTransactions(username: string, role: string) {
      const user = await User.findOne({ username });
      if (!user) {
        throw createHttpError(404, "User not found");
      }
  
      let transactions;
      if (user.role === "company") {
        transactions = await Transaction.find();
      } else {
        transactions = await Transaction.find({
          $or: [{ debtor: user.username }, { creditor: user.username }],
        });
      }
  
      return transactions;
    }
  
    async getTransactionsByClientId(clientId: string, username: string, role: string) {
    
      const clientObjectId = new mongoose.Types.ObjectId(clientId);
  
      const creator = await User.findOne({ username });
      if (!creator) {
        throw createHttpError(404, "Creator not found");
      }
  
      const client = await User.findById(clientObjectId).populate("transactions");
      if (!client) {
        throw createHttpError(404, "Client not found");
      }
  
      if (!creator.subordinates.includes(clientObjectId)) {
        throw createHttpError(403, "Access denied: Client is not in your clients list");
      }
  
      return client.transactions;
    }
  
    async deleteTransaction(id: string, session: mongoose.ClientSession) {
      const deletedTransaction = await Transaction.findByIdAndDelete(id).session(session);
      if (!deletedTransaction) {
        throw createHttpError(404, "Transaction not found");
      }
  
      await User.updateMany(
        { transactions: id },
        { $pull: { transactions: id } },
        { session }
      );
  
      return deletedTransaction;
    }
  }
  
  export default TransactionService;