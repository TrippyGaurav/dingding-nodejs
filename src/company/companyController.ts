import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import User from "../users/userModel";

export const createCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.body;

    // Validate required fields
    if (!user || !user.name || !user.username || !user.password || !user.role) {
      throw createHttpError(
        400,
        "All required fields (name, username, password, role) must be provided"
      );
    }

    const existingCompany = await User.findOne({ username: user.username });
    if (existingCompany) {
      throw createHttpError(409, "Company already exists");
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    // Create the new company with infinite credits
    const company = new User({
      name: user.name,
      username: user.username,
      password: hashedPassword,
      role: user.role,
      credits: Infinity, // Assign infinite credits
    });

    await company.save();
    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
};
