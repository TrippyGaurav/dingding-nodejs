import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../users/userType";
import createHttpError from "http-errors";
import mongoose from "mongoose";

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

    if (type === "recharge") {
      if (creator.credits < amount) {
        throw createHttpError(400, "Insufficient credits to recharge");
      }
      client.credits += amount;
      client.totalRecharged += amount; // Update total recharged
      creator.credits -= amount;
    } else if (type === "redeem") {
      if (client.credits < amount) {
        throw createHttpError(400, "Client has insufficient credits to redeem");
      }
      client.credits -= amount;
      client.totalRedeemed += amount; // Update total redeemed
      creator.credits += amount;
    }

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
