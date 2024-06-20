import mongoose from "mongoose";
import { Games, Payout } from "./gamestype";
import { json } from "body-parser";
const GameSchema = new mongoose.Schema<Games>(
  {
    gameName: { type: String, required: true, unique: true },
    gameThumbnailUrl: {
      type: String,
      required: true,
      default:
        "https://res.cloudinary.com/dhl5hifpz/image/upload/v1718447154/casinoGames/jiddczkc9oxak77h88kg.png",
    },
    gameHostLink: { type: String, required: true },
    type: { type: String, required: true },
    category: { type: String, required: true },
    status: {
      type: Boolean,
      require: true,
      default: true,
    },
    tagName: {
      type: String,
      require: true,
    },
    payout: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payouts",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const PayoutSchema = new mongoose.Schema<Payout>({
  gameName: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
});

export const Game = mongoose.model<Games>("casinoGames", GameSchema);
export const Payouts = mongoose.model<Payout>("GamesPayout", PayoutSchema);
// export default { Game, Payouts };
