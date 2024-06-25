import { Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  status: string;
  password: string;
  role: string;
  subordinates: Types.ObjectId[];
  transactions: Types.ObjectId[];
  lastLogin: Date;
  loginTimes: number;
  totalRecharged: number;
  totalRedeemed: number;
  credits: number;
  createdAt: Date;
}
