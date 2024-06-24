import mongoose, { Document } from "mongoose";

export interface ITransaction extends Document {
  debtor: mongoose.Types.ObjectId;
  creditor: mongoose.Types.ObjectId;
  type: string;
  amount: number;
  createdAt: Date;
}
