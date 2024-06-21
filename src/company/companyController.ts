import { Request, Response, NextFunction } from "express";
import { BaseUser } from "../dashboard/user/userModel";
import bcrypt from "bcrypt";

export const createCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.body;
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const company = new BaseUser({
      ...user,
      password: hashedPassword,
      credits: Infinity,
    });
    await company.save();
    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
};
