import Transaction from "./transactionModel";
import User from "../user/userModel";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import createHttpError from "http-errors";
import {
  AuthRequest,
  validatePaginationParams,
  getPaginationMetadata,
} from "../../utils/utils";
//{UPDATE THE USER CREDITS}
export const transferCredits = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { to_updateClient, credits } = req.body;
  const { userName, userRole } = req as AuthRequest;

  const TransactionSession = await mongoose.startSession();
  TransactionSession.startTransaction();

  // Validate request data
  if (!to_updateClient || !credits || !userName || !userRole) {
    const missingFields = [
      "to_updateClient",
      "credits",
      "userName",
      "userRole",
    ].filter((field) => !req.body[field] && !(req as AuthRequest)[field]);
    const errorMessage = `All fields are required to make a transaction. Missing: ${missingFields.join(
      ", "
    )}`;
    return next(createHttpError(400, errorMessage));
  }

  const creditsNumber = Number(credits);
  if (isNaN(creditsNumber) || creditsNumber < 0) {
    return next(
      createHttpError(400, "Credits must be a valid non-negative number")
    );
  }

  try {
    const Creditor = await User.findOne({ username: userName }).session(
      TransactionSession
    );
    const Debitor = await User.findOne({ username: to_updateClient }).session(
      TransactionSession
    );

    if (!Creditor || !Debitor) {
      const missingUsers = [];
      if (!Creditor) missingUsers.push("Creditor");
      if (!Debitor) missingUsers.push("Debitor");
      throw createHttpError(
        400,
        `${missingUsers.join(" and ")} user${
          missingUsers.length > 1 ? "s" : ""
        } not found.`
      );
    }

    if (Creditor.credits === undefined || Creditor.credits < creditsNumber) {
      throw createHttpError(400, "Insufficient credits for this transaction.");
    }

    const transactionData = {
      credit: creditsNumber,
      creditorDesignation: userRole,
      debitorDesignation: Debitor.designation,
      creditor: userName,
      debitor: to_updateClient,
    };

    const [transaction] = await Transaction.create([transactionData], {
      session: TransactionSession,
    });

    // Update Debitor credits
    const updatedDebitor = await User.findOneAndUpdate(
      { username: to_updateClient },
      {
        $inc: { credits: creditsNumber },
        ...(creditsNumber > 0 && { $inc: { totalRecharged: creditsNumber } }),
        ...(creditsNumber < 0 && {
          $inc: { totalRedeemed: Math.abs(creditsNumber) },
        }),
      },
      { new: true, session: TransactionSession }
    );

    if (!updatedDebitor)
      throw createHttpError(500, "Failed to update Debitor credits.");

    // Update Creditor credits and transactions if Creditor is not a company
    if (Creditor.designation !== "company") {
      const updatedCreditor = await User.findOneAndUpdate(
        { username: userName },
        {
          $inc: { credits: -creditsNumber },
          $push: { transactions: transaction._id },
        },
        { new: true, session: TransactionSession }
      );

      if (!updatedCreditor)
        throw createHttpError(500, "Failed to update Creditor credits.");
    }

    await TransactionSession.commitTransaction();
    res.status(200).json({ message: "Credits updated successfully." });
  } catch (error) {
    await TransactionSession.abortTransaction();
    next(error);
  } finally {
    TransactionSession.endSession();
  }
};
//All Transaction of the currect user
export const transactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userName } = req as AuthRequest;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    const { page: validatedPage, limit: validatedLimit } =
      validatePaginationParams({ page, limit });

    const user = await User.findOne({ username: userName }).populate({
      path: "transactions",
      options: {
        skip: (validatedPage - 1) * validatedLimit,
        limit: validatedLimit,
      },
    });

    if (!user) {
      return next(createHttpError(404, "User Not Found"));
    }

    const totalTransactions = user.transactions.length;
    const transactions = user.transactions;

    const paginationMetadata = getPaginationMetadata(
      validatedPage,
      validatedLimit,
      totalTransactions
    );

    return res.status(200).json({
      message: "Transactions fetched successfully",
      data: transactions,
      pagination: paginationMetadata,
    });
  } catch (err) {
    console.error("Error fetching transactions", err);
    return next(err); // Forward the error to the next middleware
  }
};
