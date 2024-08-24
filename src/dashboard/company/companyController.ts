import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import UserService from "../users/userService";
import { generateOTP, sendOTP } from "./otpUtils";
export class companyController {
    private userService: UserService;
    async createCompany(req: Request, res: Response, next: NextFunction) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            const { user } = req.body;
            if (
                !user ||
                !user.name ||
                !user.username ||
                !user.password

            ) {
                throw createHttpError(400, "All required fields must be provided");
            }

            let existingUser =
                (await this.userService.findPlayerByUsername(user.username, session)) ||
                (await this.userService.findUserByUsername(user.username, session));
            if (existingUser) {
                throw createHttpError(409, "User already exists");
            }

            const hashedPassword = await bcrypt.hash(user.password, 10);
            let newUser;
            newUser = await this.userService.createUser(
                { ...user, role: "company", credits: Infinity, createdBy: 'SuperAdmin' },
                0,
                hashedPassword,
                session
            );
            await newUser.save({ session });
            await session.commitTransaction();
            res.status(201).json(newUser);
        } catch (error) {
            next(error);
        } finally {
            session.endSession();
        }
    }















}