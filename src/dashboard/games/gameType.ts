import mongoose, { Document, Types } from "mongoose";

export interface IPlatform extends Document {
  name: string;
  games: mongoose.Types.ObjectId[];
}

export interface IGame extends Document {
  name: string;
  thumbnail: string;
  url: string;
  type: string;
  category: string;
  status: string;
  tagName: string;
  slug: string;
  payout: Types.ObjectId;
}
