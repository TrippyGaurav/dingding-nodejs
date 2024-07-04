import { NextFunction, Request, Response } from "express";
import {
  AuthRequest,
  getSubordinateModel,
  updateCredits,
  updatePassword,
  updateStatus,
} from "../utils/utils";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

import bcrypt from "bcrypt";

import mongoose from "mongoose";
import { User, Player } from "./userModel";

import UserService from "./userService";

export class UserController {
  private userService : UserService;
  private static rolesHierarchy = {
    company: ["master", "distributor", "subdistributor", "store", "player"],
    master: ["distributor"],
    distributor: ["subdistributor"],
    subdistributor: ["store"],
    store: ["player"],
  };

  constructor(){
    this.userService = new UserService();
    this.loginUser = this.loginUser.bind(this);
    this.createUser = this.createUser.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.getAllSubordinates = this.getAllSubordinates.bind(this);
    this.getSubordinateById = this.getSubordinateById.bind(this);
    this.getClientsOfClient = this.getClientsOfClient.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.updateClient = this.updateClient.bind(this)
  }

  public static getSubordinateRoles(role: string): string[] {
    return this.rolesHierarchy[role] || [];
  }

  public static isRoleValid(role: string, subordinateRole: string): boolean { 
    return this.getSubordinateRoles(role).includes(subordinateRole);
  }


  async loginUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw createHttpError(400, "Username and password are required");
      }

      const user = await this.userService.findUserByUsername(username);
      const player = await this.userService.findPlayerByUsername(username);

      if(user && player){
        throw createHttpError(400, "Something went wrong. Please contact manager for assistancee")
      }

      let role:string;
      if(user){
        role = "user";
      }
      else if(player){
        role = "player";
      }
      else{
        throw createHttpError(401, "Invalid User")
      }

      const isPasswordValid = await bcrypt.compare(password, user?user.password : player.password);

      if(!isPasswordValid){
        throw createHttpError(401, "Invalid username or password")
      }

      user.lastLogin = new Date();
      user.loginTimes = (user.loginTimes || 0) + 1;
      await user.save()

      const token = jwt.sign({username : user ? user.username : player.username, role : user ? user.role : player.role}, config.jwtSecret!, {expiresIn:"24h"});

      res.cookie("userToken", token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "none",
      });

      res.status(200).json({
        message:"Login successful",
        token:token,
        role:user ? user.role : player.role
      })

    } catch (error) {
      next(error)
    }``
  }

  async createUser(req: Request, res: Response, next: NextFunction){
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const _req = req as AuthRequest;
      const {user} = req.body;
      const {username, role} = _req.user; // ADMIN


      if (!user || !user.name || !user.username || !user.password || !user.role || user.credits === undefined) {
        throw createHttpError(400, "All required fields must be provided");
      }

      if(role!=="company" && !UserController.isRoleValid(role, user.role)){
        throw createHttpError(403, `A ${role} cannot create a ${user.role}`);
      }

      const admin = await this.userService.findUserByUsername(username, session);
      if(!admin){
        throw createHttpError(404, "Admin not found")
      }


      let existingUser = user.role === "player" ? await this.userService.findPlayerByUsername(user.username, session) : await this.userService.findUserByUsername(user.username, session);
      if(existingUser){
        throw createHttpError(409, "User already exists")
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      let newUser;

      if(user.role === "player"){
        newUser = await this.userService.createPlayer(user, 0,  hashedPassword, session)
      }
      else{
        newUser = await this.userService.createUser(user, 0, hashedPassword, session);
      }

      if(user.credits > 0){
        const transaction = await this.userService.createTransaction("recharge", admin, newUser, user.credits, session);
        newUser.transactions.push(transaction._id as mongoose.Types.ObjectId);
        admin.transactions.push(transaction._id as mongoose.Types.ObjectId);      
      }

      await newUser.save({session});
      admin.subordinates.push(newUser._id);
      await admin.save({session});

      await session.commitTransaction();
      res.status(201).json(newUser);
    } catch (error) {
      next(error)
    }
    finally{
      session.endSession()
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;

      let user;

      if (role === "player") {
        user = await this.userService.findPlayerByUsername(username);
      } else {
        user = await this.userService.findUserByUsername(username);
      }

      if (!user) {
        throw createHttpError(404, "User not found");
      }

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async getAllSubordinates(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;

      const user = await this.userService.findUserByUsername(username);

      if (!user) {
        throw createHttpError(404, "User not found");
      }

      const subordinateModels = UserController.rolesHierarchy[user.role];

      const subordinates = await Promise.all(
        subordinateModels.map(async (model) => {
          if (model === "Player") {
            return await this.userService.findPlayersByIds(user.subordinates);
          } else {
            return await this.userService.findUsersByIds(user.subordinates);
          }
        })
      );

      res.status(200).json(subordinates.flat());
    } catch (error) {
      next(error);
    }
  }

  async getSubordinateById(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { subordinateId } = req.params;
      const { username, role } = _req.user;

      const clientObjectId = new mongoose.Types.ObjectId(subordinateId);

      const creator = await this.userService.findUserByUsername(username);
      if (!creator) {
        throw createHttpError(404, "Creator not found");
      }

      const subordinateModel = getSubordinateModel(role);

      let client;
      if (subordinateModel === "User") {
        client = await this.userService.findUserById(clientObjectId);
      } else {
        client = await this.userService.findPlayerById(clientObjectId);
      }

      if (!client) {
        throw createHttpError(404, "Client not found");
      }

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
  }

  async getClientsOfClient(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;

      const { clientId } = req.params;

      if (!clientId) {
        throw createHttpError(400, "User ID is required");
      }

      const creator = await this.userService.findUserByUsername(username);
      if (!creator) {
        throw createHttpError(404, "Creator not found");
      }

      const clientObjectId = new mongoose.Types.ObjectId(clientId);

      if (
        role !== "company" &&
        !creator.subordinates.includes(clientObjectId)
      ) {
        throw createHttpError(
          403,
          "Forbidden: You do not have the necessary permissions to access this resource."
        );
      }

      const client = await this.userService.findUserById(clientObjectId);
      if (!client) {
        throw createHttpError(404, "Client not found");
      }

      res.status(200).json(client.subordinates);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction){
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;
      const { clientId } = req.params;

      if(!clientId){
        throw createHttpError(400, "Client Id is required");
      }

      const clientObjectId = new mongoose.Types.ObjectId(clientId);

      const admin = await this.userService.findUserByUsername(username);
      if(!admin){
        throw createHttpError(404, "Admin Not Found");
      }

      const client = (await this.userService.findUserById(clientObjectId)) || (await this.userService.findPlayerById(clientObjectId));

      if (!client) {
        throw createHttpError(404, "User not found");
      }

      if (role != "company" && !admin.subordinates.some((id) => id.equals(clientObjectId))) {
        throw createHttpError(403, "Client does not belong to the creator");
      }

      const clientRole = client.role;
      if (
        !UserController.rolesHierarchy[role] ||
        !UserController.rolesHierarchy[role].includes(clientRole)
      ) {
        throw createHttpError(
          403,
          `A ${role} cannot delete a ${clientRole}`
        );
      }

      if (client instanceof User) {
        await this.userService.deleteUserById(clientObjectId);
      } else if (client instanceof Player) {
        await this.userService.deletePlayerById(clientObjectId);
      }

      admin.subordinates = admin.subordinates.filter(
        (id) => !id.equals(clientObjectId)
      );
      await admin.save();

      res.status(200).json({ message: "Client deleted successfully" });
    } catch (error) {
      next(error)
    }
  }

  async updateClient(req: Request, res: Response, next: NextFunction) {
    try {
      const _req = req as AuthRequest;
      const { username, role } = _req.user;
      const { clientId } = req.params;
      const { status, credits, password, existingPassword } = req.body;

      if (!clientId) {
        throw createHttpError(400, "Client Id is required");
      }

      const clientObjectId = new mongoose.Types.ObjectId(clientId);

      const admin = await this.userService.findUserByUsername(username);
      if (!admin) {
        throw createHttpError(404, "Creator not found");
      }

      const client = (await this.userService.findUserById(clientObjectId)) || (await this.userService.findPlayerById(clientObjectId));

      if (!client) {
        throw createHttpError(404, "Client not found");
      }

      if (role != "company" && !admin.subordinates.some((id) => id.equals(clientObjectId))) {
        throw createHttpError(403, "Client does not belong to the creator");
      }

      if (status) {
        updateStatus(client, status);
      }

      if (password) {
        await updatePassword(client, password, existingPassword);
      }

      if (credits) {
        credits.amount = Number(credits.amount);
        await updateCredits(client, admin, credits);
      }

      await admin.save();
      await client.save();
    
      res.status(200).json({ message: "Client updated successfully", client });

    } catch (error) {
      next(error)
    }
  }  
}

