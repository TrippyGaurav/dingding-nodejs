import { Document, Types } from "mongoose";

export interface IPlayer extends Document {
  username: string;
  password: string;
  role: string;
  status: string;
  lastLogin: Date | null;
  loginTimes: number;
  credits: number;
  favouriteGames: string[];
  transactions: Types.ObjectId[];
}
