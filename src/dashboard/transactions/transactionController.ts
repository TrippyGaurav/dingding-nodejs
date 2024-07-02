import { Request, Response, NextFunction } from "express";
import { User } from "../users/userModel";
import Transaction from "./transactionModel";
import createHttpError from "http-errors";
import mongoose from "mongoose";

// create transaction
export const createTransaction = async (
  type: string,
  creator: any,
  client: any,
  amount: number,
  session: mongoose.ClientSession
) => {
  if (type === "recharge") {
    if (creator.credits < amount) {
      throw createHttpError(400, "Insufficient credits to recharge");
    }

    client.credits += amount;
    client.totalRecharged += amount;
    creator.credits -= amount;
  } else if (type === "redeem") {
    if (client.credits < amount) {
      throw createHttpError(400, "Client has insufficient credits to redeem");
    }
    client.credits -= amount;
    client.totalRedeemed += amount;
    creator.credits += amount;
  }

  const transaction = new Transaction({
    debtor: type === "recharge" ? creator._id : client._id,
    creditor: type === "recharge" ? client._id : creator._id,
    type: type,
    amount: amount,
    createdAt: new Date(),
  });

  await transaction.save({ session });

  return transaction;
};

// Get all transactions
export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { creatorUsername } = req.body;

    if (!creatorUsername) {
      throw createHttpError(400, "User not found");
    }

    const user = await User.findOne({ username: creatorUsername });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactions = await Transaction.find({
      $or: [{ debtor: user._id }, { creditor: user._id }],
    });

    res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
};

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
