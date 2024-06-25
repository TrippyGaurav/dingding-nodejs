import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../users/userType";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import Transaction from "../transactions/transactionModel";
import { createTransaction } from "../transactions/transactionController";

export const clients: Map<string, WebSocket> = new Map();

export const rolesHierarchy = {
  company: ["master"],
  master: ["distributor"],
  distributor: ["subdistributor"],
  subdistributor: ["store"],
  store: ["player"],
};

export enum MESSAGEID {
  AUTH = "AUTH",
  SPIN = "SPIN",
  GAMBLE = "GAMBLE",
  GENRTP = "GENRTP",
}

export const enum MESSAGETYPE {
  ALERT = "alert",
  MESSAGE = "message",
  ERROR = "internalError",
}

export interface AuthRequest extends Request {
  userId: string;
  userRole: string;
}

export interface CustomJwtPayload extends JwtPayload {
  role: string;
}

export const updateStatus = (client: IUser, status: string) => {
  const validStatuses = ["active", "inactive"];
  if (!validStatuses.includes(status)) {
    throw createHttpError(400, "Invalid status value");
  }
  client.status = status;
};

export const updatePassword = async (
  client: IUser,
  password: string,
  existingPassword: string
) => {
  if (!existingPassword) {
    throw createHttpError(
      400,
      "Existing password is required to update the password"
    );
  }

  // Check if existingPassword matches client's current password
  const isPasswordValid = await bcrypt.compare(
    existingPassword,
    client.password
  );
  if (!isPasswordValid) {
    throw createHttpError(400, "Existing password is incorrect");
  }

  // Update password
  client.password = await bcrypt.hash(password, 10);
};

export const updateCredits = async (
  client: IUser,
  creator: IUser,
  credits: { type: string; amount: number }
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { type, amount } = credits;

    if (!type || !amount || !["recharge", "redeem"].includes(type)) {
      throw createHttpError(
        400,
        "Credits must include a valid type ('recharge' or 'redeem') and amount"
      );
    }

    const transaction = await createTransaction(
      type,
      creator,
      client,
      amount,
      session
    );

    // Add the transaction to both users' transactions arrays
    client.transactions.push(transaction._id as mongoose.Types.ObjectId);
    creator.transactions.push(transaction._id as mongoose.Types.ObjectId);

    await client.save({ session });
    await creator.save({ session });

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
