import mongoose, { Model, Schema } from "mongoose";
import { IUser } from "./userType";

const UserSchema: Schema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    status: { type: String, default: "active" },
    password: { type: String, required: true },
    role: { type: String, required: true },
    subordinates: [
      { type: mongoose.Types.ObjectId, refPath: "subordinateModel" },
    ], // Reference different models

    transactions: [{ type: mongoose.Types.ObjectId, ref: "Transaction" }],
    lastLogin: { type: Date, default: null },
    loginTimes: { type: Number, default: 0 },
    totalRecharged: { type: Number, default: 0 },
    totalRedeemed: { type: Number, default: 0 },
    credits: { type: Number, required: true },
  },
  { timestamps: true }
);

UserSchema.virtual("subordinateModel").get(function (this: IUser) {
  // Determine the subordinate model based on the role
  const rolesHierarchy = {
    company: "User",
    master: "User",
    distributor: "User",
    subdistributor: "User",
    store: "Player",
  };
  return rolesHierarchy[this.role];
});

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
