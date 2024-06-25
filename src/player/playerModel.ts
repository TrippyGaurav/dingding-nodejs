import mongoose, { Schema } from "mongoose";
import { IPlayer } from "./playerType";

const PlayerSchema = new Schema<IPlayer>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "player", immutable: true },
    status: { type: String, default: "active" },
    lastLogin: { type: Date, default: null },
    loginTimes: { type: Number, default: 0 },
    credits: { type: Number, default: 0 },
    favouriteGames: { type: [String], default: [] },
    transactions: [{ type: mongoose.Types.ObjectId, ref: "Transaction" }],
  },
  { timestamps: true }
);

const Player = mongoose.model<IPlayer>("Player", PlayerSchema);
export default Player;
