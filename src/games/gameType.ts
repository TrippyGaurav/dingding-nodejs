import { Document } from "mongoose";

export interface IGame extends Document {
  name: string;
  thumbnail: string;
  url: string;
  type: string;
  category: string;
  status: string;
  tagName: string;
  slug: string;
}
