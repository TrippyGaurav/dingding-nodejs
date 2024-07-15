import mongoose, { Schema, Types } from "mongoose";
import { IGame, INewPlatform, IPlatform } from "./gameType";

const PlatformSchema = new Schema<IPlatform>({
  name: { type: String, required: true, unique: true },
  games: [{ type: mongoose.Types.ObjectId, ref: "Game" }]
})

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
      unique: true, // Ensure slug is unique
    },
    payout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payouts",
    },
  },
  { timestamps: true }
);

const PayoutsSchema = new Schema(
  {
    gameName: {
      type: String,
      required: true,
      unique: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

const newGameSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  tagName: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  payout: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Payout'
  }
});

const newPlatformSchema = new Schema<INewPlatform>({
  name: {
    type: String,
    required: true
  },
  games: {
    type: [newGameSchema],
  }
});


const Game = mongoose.model<IGame>("Game", GameSchema);
const Payouts = mongoose.model("Payouts", PayoutsSchema);
const Platform = mongoose.model("Platform", PlatformSchema);
const NewPlatform = mongoose.model("NewPlatform", newPlatformSchema)

export { Payouts, Platform, NewPlatform };
export default Game;
