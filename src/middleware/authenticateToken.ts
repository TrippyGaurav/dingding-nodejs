import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { verify } from "jsonwebtoken";
import { config } from "../config/config";
import { AuthRequest, CustomJwtPayload } from "../utils/utils";

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.header("Authorization");

  if (!token) {
    return next(createHttpError(401, "Authorization token is required"));
  }

  try {
    const parsedToken = token.split(" ")[1];
    const decoded = verify(
      parsedToken,
      config.jwtSecret as string
    ) as CustomJwtPayload;

    const _req = req as AuthRequest;
    _req.userId = decoded.userId;
    _req.userRole = decoded.role;

    next();
  } catch (error) {
    console.log("Error : ", error);
    return next(createHttpError(401, "Token expired"));
  }
}
