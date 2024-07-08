import mongoose from "mongoose";
import { ITransaction } from "./transactionType";
import { rolesHierarchy } from "../utils/utils";
import createHttpError from "http-errors";
import Transaction from "./transactionModel";
import { User } from "../users/userModel";

export class TransactionService {
  async createTransaction(type: string, manager: any, client: any, amount: number, session: mongoose.ClientSession): Promise<ITransaction> {
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

  getTransactions(username: string, role: string) {
    return User.findOne({ username }).then(user => {
      if (!user) {
        throw createHttpError(404, "User not found");
      }

      if (user.role === "company") {
        return Transaction.find(); 
      } else {
        return Transaction.find({
          $or: [{ debtor: user.username }, { creditor: user.username }],
        }); 
      }
    });
  }

  getTransactionsByClientId(clientId: string, username: string, role: string) {
    const clientObjectId = new mongoose.Types.ObjectId(clientId);
    return User.findOne({ username }).then(creator => {
      if (!creator) {
        throw createHttpError(404, "Creator not found");
      }
      return User.findById(clientObjectId).populate("transactions").then(client => {
        if (!client) {
          throw createHttpError(404, "Client not found");
        }
        if (!creator.subordinates.includes(clientObjectId)) {
          throw createHttpError(403, "Access denied: Client is not in your clients list");
        }
        return client.transactions; 
      });
    });
  }

  deleteTransaction(id: string, session: mongoose.ClientSession) {
    return Transaction.findByIdAndDelete(id).session(session); 
  }
}

export default TransactionService;
