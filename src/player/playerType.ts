import { Document } from "mongoose";

export interface IPlayer extends Document {
  username: string;
  password: string;
  status: string;
  lastLogin: Date | null;
  loginTimes: number;
  credits: number;
  favouriteGames: string[];
}
