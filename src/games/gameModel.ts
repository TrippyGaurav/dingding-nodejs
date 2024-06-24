import mongoose, { Schema } from "mongoose";
import { IGame } from "./gameType";

const GameSchema = new Schema<IGame>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    thumbnail: {
      type: String,
      required: true,
      default:
        "https://res.cloudinary.com/dhl5hifpz/image/upload/v1718447154/casinoGames/jiddczkc9oxak77h88kg.png",
    },
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "active",
    },
    tagName: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Game = mongoose.model<IGame>("Game", GameSchema);
export default Game;
