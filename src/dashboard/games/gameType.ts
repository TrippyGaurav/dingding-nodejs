import mongoose, { Document, Types } from "mongoose";



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
  createdAt: Date
}


export interface IPlatform extends Document {
  name: string;
  games: IGame[]
}


