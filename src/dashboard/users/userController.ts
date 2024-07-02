import { NextFunction, Request, Response } from "express";
import {
  AuthRequest,
  getSubordinateModel,
  rolesHierarchy,
  updateCredits,
  updatePassword,
  updateStatus,
} from "../../utils/utils";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { config } from "../../config/config";

import bcrypt from "bcrypt";

import mongoose from "mongoose";
import { User, Player } from "./userModel";
import { createTransaction } from "../transactions/transactionController";

// DONE
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

    // Check if user exists in either User or Player model
    const user = await User.findOne({ username });
    const player = await Player.findOne({ username });

    // Handle the case where the username exists in both models
    if (user && player) {
      throw createHttpError(
        400,
        "Some went wrong. Please contact manger for assistance. "
      );
    }

    // Determine the user's role
    let role: string;
    if (user) {
      role = "user";
    } else if (player) {
      role = "player";
    } else {
      throw createHttpError(401, "Invalid username or password");
    }

    // validate password
    const isPasswordValid = await bcrypt.compare(
      password,
      user ? user.password : player.password
    );

    if (!isPasswordValid) {
      throw createHttpError(401, "Invalid username or password");
    }

    user.lastLogin = new Date();
    user.loginTimes = (user.loginTimes || 0) + 1;
    await user.save();

    // Generate and send JWT token
    const token = jwt.sign(
      {
        username: user ? user.username : player.username,
        role: user ? user.role : player.role,
      },
      config.jwtSecret!,
      { expiresIn: "1h" }
    );

    res.cookie("userToken", token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      // secure: true,
      sameSite: "none",
    });

    res.status(200).json({
      message: "Login successful",
      token: token,
      role: user ? user.role : player.role,
    });
  } catch (error) {
    next(error);
  }
};

// DONE
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const _req = req as AuthRequest;
    const { user } = req.body;
    const { username, role } = _req.user;

    // Validate input
    if (
      !user ||
      !user.name ||
      !user.username ||
      !user.password ||
      !user.role ||
      user.credits === undefined
    ) {
      throw createHttpError(400, "All required fields must be provided");
    }

    if (!rolesHierarchy[role] || !rolesHierarchy[role].includes(user.role)) {
      throw createHttpError(403, `A ${role} cannot create a ${user.role}`);
    }

    // Check if creator exists
    const creator = await User.findOne({ username }).session(session);
    if (!creator) {
      throw createHttpError(404, "Creator not found");
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      username: user.username,
    }).session(session);
    if (existingUser) {
      throw createHttpError(409, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    let newUser;
    if (user.role === "player") {
      newUser = new Player({
        name: user.name,
        username: user.username,
        password: hashedPassword,
        role: user.role,
        credits: 0,
      });
    } else {
      newUser = new User({
        name: user.name,
        username: user.username,
        password: hashedPassword,
        role: user.role,
        credits: 0,
      });
    }

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
    }

    // Save the new user and update the creator's clients within the transaction session
    await newUser.save({ session });
    creator.subordinates.push(newUser._id);
    await creator.save({ session });

    await session.commitTransaction();
    res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// DONE
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const { username, role } = _req.user;

    let user;

    if (role === "player") {
      user = await Player.findOne({ username });
    } else {
      user = await User.findOne({ username });
    }

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// DONE
export const getAllSubordinates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { creatorUsername } = req.body;

    const user = await User.findOne({
      username: creatorUsername,
    });

    console.log(user);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const rolesHierarchy = {
      company: "User",
      master: "User",
      distributor: "User",
      subdistributor: "User",
      store: "Player",
    };

    const subordinateModel = rolesHierarchy[user.role];

    const populatedUser = await User.findOne({
      username: creatorUsername,
    }).populate({
      path: "subordinates",
      model: subordinateModel,
    });

    res.status(200).json(populatedUser.subordinates);
  } catch (error) {
    next(error);
  }
};

// DONE
export const getSubordinateById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _req = req as AuthRequest;
    const { subordinateId } = req.params;
    const { username, role } = _req.user;

    // Convert clientId to ObjectId
    const clientObjectId = new mongoose.Types.ObjectId(subordinateId);

    // Check if creator exists
    const creator = await User.findOne({ username });
    if (!creator) {
      throw createHttpError(404, "Creator not found");
    }

    // Determine the subordinate model based on the creator's role
    const subordinateModel = getSubordinateModel(role);

    // Check if client exists and populate its subordinates if it's a User
    let client;
    if (subordinateModel === "User") {
      client = await User.findById(clientObjectId)
        .select("_id name username status role subordinates transactions")
        .populate("subordinates");
    } else {
      client = await mongoose
        .model("Player")
        .findById(clientObjectId)
        .select("_id name username status role transactions");
    }

    if (!client) {
      throw createHttpError(404, "Client not found");
    }

    // Check if client is in creator's subordinates list or creator has role 'company'
    if (role !== "company" && !creator.subordinates.includes(clientObjectId)) {
      throw createHttpError(
        403,
        "Access denied: Client is not in your subordinates list"
      );
    }

    res.status(200).json(client);
  } catch (error) {
    next(error);
  }
};

// GET CLIENT OF ANY USER : Accessible to company only
export const getClientsOfClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { creatorRole, creatorUsername } = req.body;
    const { clientId } = req.params;

    // Validate input
    if (!clientId) {
      throw createHttpError(400, "User ID is required");
    }

    // Check if creator exists
    const creator = await User.findOne({ username: creatorUsername });
    if (!creator) {
      throw createHttpError(404, "Creator not found");
    }

    // Convert clientId to ObjectId
    const clientObjectId = new mongoose.Types.ObjectId(clientId);

    // Check if the creatorRole is company or the clientId is in the creator's clients list
    if (
      creatorRole !== "company" &&
      !creator.subordinates.includes(clientObjectId)
    ) {
      throw createHttpError(
        403,
        "Forbidden: You do not have the necessary permissions to access this resource."
      );
    }

    // Check if client exists
    const client = await User.findById(clientObjectId).populate("clients");
    if (!client) {
      throw createHttpError(404, "Client not found");
    }

    res.status(200).json(client.subordinates);
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
    if (!creator.subordinates.some((id) => id.equals(clientObjectId))) {
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
    creator.subordinates = creator.subordinates.filter(
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

    console.log("Credit to be updated : ", credits);

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
    if (!creator.subordinates.some((id) => id.equals(clientObjectId))) {
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
      // Convert credits amount to number
      credits.amount = Number(credits.amount);
      await updateCredits(client, creator, credits);
    }

    await creator.save();
    await client.save();

    res.status(200).json({ message: "Client updated successfully", client });
  } catch (error) {
    next(error);
  }
};
