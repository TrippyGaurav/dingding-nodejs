import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  status: string;
  password: string;
  role: string;
  clients: mongoose.Types.ObjectId[];
  transactions: any[];
  lastLogin: Date;
  loginTimes: number;
  totalRecharged: number;
  totalRedeemed: number;
  credits: number;
  createdAt: Date;
}
