import mongoose, { Schema } from "mongoose";
import { IUser } from "./userType";

const UserSchema: Schema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    status: { type: String, default: "active" },
    password: { type: String, required: true },
    role: { type: String, required: true },
    clients: [{ type: mongoose.Types.ObjectId, ref: "BaseUser" }],
    transactions: [{ type: Schema.Types.Mixed }],
    lastLogin: { type: Date, default: null },
    loginTimes: { type: Number, default: 0 },
    totalRecharged: { type: Number, default: 0 },
    totalRedeemed: { type: Number, default: 0 },
    credits: { type: Number, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
