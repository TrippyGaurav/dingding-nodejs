import { Response } from "express";
import { Player, User } from "./userModel";
import { IPlayer, IUser } from "./userType";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

export async function getUserByUsername(username: string, isPlayer: boolean) {
  if (isPlayer) {
    return await Player.findOne({ username });
  } else {
    return await User.findOne({ username });
  }
}

export async function updateUserLoginInfo(user: IUser | IPlayer) {
  user.lastLogin = new Date();
  user.loginTimes = (user.loginTimes || 0) + 1;
  await user.save();
}

export function generateJwtToken(user: IUser | IPlayer) {
  return jwt.sign(
    { username: user.username, role: user.role },
    config.jwtSecret!,
    { expiresIn: "1h" }
  );
}

export function sendJwtToken(res: Response, token: string) {
  res.cookie("userToken", token, {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    // secure: true,
    sameSite: "none",
  });
}
