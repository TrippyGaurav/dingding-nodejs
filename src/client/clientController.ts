import { NextFunction, Request, Response } from "express";
import { rolesHierarchy } from "../utils/utils";
import createHttpError from "http-errors";
import { BaseUser, Player } from "../dashboard/user/userModel";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

export const createClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { creatorRole, creatorUsername } = req.body;
    console.log("Creator : ", creatorUsername);

    const user = req.body.user;

    if (
      !rolesHierarchy[creatorRole] ||
      !rolesHierarchy[creatorRole].includes(user.role)
    ) {
      throw createHttpError(
        403,
        `A ${creatorRole} cannot create a ${user.role}`
      );
    }

    const creator = await BaseUser.findOne({ username: creatorUsername });
    if (!creator) {
      throw createHttpError(404, "Creator not found");
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    let newUser;
    if (user.role === "player") {
      newUser = new Player({ ...user, password: hashedPassword });
    } else {
      newUser = new BaseUser({ ...user, password: hashedPassword });
    }

    await newUser.save();
    creator.clients.push(newUser._id);
    await creator.save();

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

export const getClients = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { creatorUsername } = req.body;

    const user = await BaseUser.findOne({
      username: creatorUsername,
    }).populate("clients");

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    res.status(200).json(user.clients);
  } catch (error) {
    next(error);
  }
};

export const getUsersOfClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { creatorRole } = req.body;

    if (creatorRole != "company") {
      throw createHttpError(
        403,
        `Forbidden: You do not have the necessary permissions to access this resource.`
      );
    }

    const { client } = req.params;
    const creator = await BaseUser.findOne({
      username: client,
    }).populate("clients");

    if (!creator) {
      throw createHttpError(404, `${client} not found`);
    }

    res.status(200).json(creator.clients);
  } catch (error) {
    next(error);
  }
};

export const loginClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;
    const user = await BaseUser.findOne({ username });

    if (!user) {
      throw createHttpError(401, "Invalid username or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw createHttpError(401, "Invalid username or password");
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      config.jwtSecret!,
      { expiresIn: "1h" }
    );

    res.cookie("userToken", token, { httpOnly: true, secure: true });
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    next(error);
  }
};
