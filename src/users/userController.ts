import { NextFunction, Request, Response } from "express";
import {
  rolesHierarchy,
  updateCredits,
  updatePassword,
  updateStatus,
} from "../utils/utils";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import bcrypt from "bcrypt";

import mongoose from "mongoose";
import User from "./userModel";
import Player from "../player/playerModel";
import { createTransaction } from "../transactions/transactionController";

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      throw createHttpError(400, "Username and password are required");
    }

    // Check if user exists
    const user = await User.findOne({ username });

    if (!user) {
      throw createHttpError(401, "Invalid username or password");
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw createHttpError(401, "Invalid username or password");
    }

    // Update lastLogin and loginTimes
    user.lastLogin = new Date();
    user.loginTimes = (user.loginTimes || 0) + 1;
    await user.save();

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

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { creatorRole, creatorUsername } = req.body;

    const user = req.body.user;

    // Validate Creator
    if (!creatorRole || !creatorUsername) {
      throw createHttpError(403, "Unable to verify the creator");
    }

    // Validate input
    if (
      !user ||
      !user.username ||
      !user.password ||
      !user.role ||
      user.credits === undefined
    ) {
      throw createHttpError(400, "All required fields must be provided");
    }

    if (
      !rolesHierarchy[creatorRole] ||
      !rolesHierarchy[creatorRole].includes(user.role)
    ) {
      throw createHttpError(
        403,
        `A ${creatorRole} cannot create a ${user.role}`
      );
    }

    // Check if creator exists
    const creator = await User.findOne({ username: creatorUsername });
    if (!creator) {
      throw createHttpError(404, "Creator not found");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: user.username });
    if (existingUser) {
      throw createHttpError(409, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    let newUser;
    if (user.role === "player") {
      newUser = new Player({ ...user, password: hashedPassword });
    } else {
      newUser = new User({ ...user, password: hashedPassword });
    }

    await newUser.save({ session });
    creator.clients.push(newUser._id);
    await creator.save({ session });

    if (user.credits > 0) {
      const transaction = await createTransaction(
        "recharge",
        creator,
        newUser,
        user.credits,
        session
      );

      // Add the transaction to both users' transactions arrays
      newUser.transactions.push(transaction._id as mongoose.Types.ObjectId);
      creator.transactions.push(transaction._id as mongoose.Types.ObjectId);

      await newUser.save({ session });
      await creator.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(newUser);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { creatorUsername } = req.body;

    const user = await User.findOne({
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

export const getClientsOfUser = async (
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

    const { username } = req.params;
    const creator = await User.findOne({
      username: username,
    }).populate("clients");

    if (!creator) {
      throw createHttpError(404, `${username} not found`);
    }

    res.status(200).json(creator.clients);
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { creatorUsername, creatorRole } = req.body;
    const { clientId } = req.params;

    // Validate creator
    if (!creatorUsername || !creatorRole) {
      throw createHttpError(403, "Forbidden : Access Denied");
    }

    // Validate input
    if (!clientId) {
      throw createHttpError(400, "Client Id is required");
    }

    // Convert clientId to ObjectId
    const clientObjectId = new mongoose.Types.ObjectId(clientId);

    // Check if creator exists
    const creator = await User.findOne({ username: creatorUsername });
    if (!creator) {
      throw createHttpError(404, "Creator not found");
    }

    // Check if client exists
    const client =
      (await User.findById(clientObjectId)) ||
      (await Player.findById(clientObjectId));
    if (!client) {
      throw createHttpError(404, "Client not found");
    }

    // Check if client is in creator's clients list
    if (!creator.clients.some((id) => id.equals(clientObjectId))) {
      throw createHttpError(403, "Client does not belong to the creator");
    }

    // Check role hierarchy
    const clientRole = client.role;
    if (
      !rolesHierarchy[creatorRole] ||
      !rolesHierarchy[creatorRole].includes(clientRole)
    ) {
      throw createHttpError(
        403,
        `A ${creatorRole} cannot delete a ${clientRole}`
      );
    }

    // Remove client
    if (client instanceof User) {
      await User.findByIdAndDelete(clientObjectId);
    } else if (client instanceof Player) {
      await Player.findByIdAndDelete(clientObjectId);
    }

    // Update creator's clients list
    creator.clients = creator.clients.filter(
      (id) => !id.equals(clientObjectId)
    );
    await creator.save();

    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { creatorUsername, creatorRole } = req.body;
    const { clientId } = req.params;
    const { status, credits, password, existingPassword } = req.body;

    // Validate creator
    if (!creatorUsername || !creatorRole) {
      throw createHttpError(403, "Forbidden: Access Denied");
    }

    // Validat input
    if (!clientId) {
      throw createHttpError(400, "Client Id is required");
    }

    // Convert clientId to ObjectId
    const clientObjectId = new mongoose.Types.ObjectId(clientId);

    // Check if creator exists
    const creator = await User.findOne({ username: creatorUsername });
    if (!creator) {
      throw createHttpError(404, "Creator not found");
    }

    // Check if client exists
    const client =
      (await User.findById(clientObjectId)) ||
      (await Player.findById(clientObjectId));
    if (!client) {
      throw createHttpError(404, "Client not found");
    }

    // Check if client is in creator's clients list
    if (!creator.clients.some((id) => id.equals(clientObjectId))) {
      throw createHttpError(403, "Client does not belong to the creator");
    }

    // Update client's details
    if (status) {
      updateStatus(client, status);
    }

    if (password) {
      await updatePassword(client, password, existingPassword);
    }

    if (credits) {
      await updateCredits(client, creator, credits);
    }

    await creator.save();
    await client.save();

    res.status(200).json({ message: "Client updated successfully", client });
  } catch (error) {
    next(error);
  }
};

export const getCredits = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    
  } catch (error) {
    
  }
};
