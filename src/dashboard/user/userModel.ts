import mongoose, { Schema } from "mongoose";
import { IBaseUser, IPlayer, User } from "./userType";

const userSchema = new mongoose.Schema<User>(
  {
    username: {
      type: String,
      required: true,
    },
    nickName: {
      type: String,
    },
    activeStatus: {
      type: Boolean,
      default: true,
    },
    password: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    clientList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
    favourite: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game",
      },
    ],
    lastLogin: {
      type: String,
    },
    loginTimes: {
      type: Number,
      default: 0,
    },
    totalRecharged: {
      type: Number,
      default: 0,
    },
    totalRedeemed: {
      type: Number,
      default: 0,
    },
    credits: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const BaseUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  clients: { type: [String], required: true },
  transactions: { type: [Schema.Types.Mixed], required: true },
  lastLogin: { type: Date, required: true },
  loginTimes: { type: Number, required: true },
  totalRecharged: { type: Number, required: true },
  totalRedeemed: { type: Number, required: true },
  credits: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const PlayerSchema: Schema = new Schema({
  favouriteGames: { type: [String], required: true },
});

const BaseUser = mongoose.model<IBaseUser>("BaseUser", BaseUserSchema);
const Player = BaseUser.discriminator<IPlayer>("Player", PlayerSchema);
const User = mongoose.model<User>("User", userSchema);

export { BaseUser, Player };
export default User;
