import { NextFunction, Request, Response } from "express";
import { config } from "../config/config";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";

interface DecodedToken {
  username: string;
  role: string;
}

export function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { apiKey } = req.body;

  if (apiKey !== config.companyApiKey) {
    return next(createHttpError(403, "Invalid API key"));
  }
  next();
}

export function extractRoleFromCookie(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cookie = req.headers.cookie
    ?.split("; ")
    .find((row) => row.startsWith("userToken="))
    ?.split("=")[1];
  console.log(cookie);
  if (cookie) {
    jwt.verify(
      cookie,
      process.env.JWT_SECRET!,
      (err, decoded: DecodedToken | undefined) => {
        if (err) {
          console.error("Token verification failed:", err.message);
          return res.status(401).json({ error: "You are not authenticated" });
        } else {
          req.body = {
            ...req.body,
            username: decoded!.username,
            role: decoded!.role,
          };
          console.log("Authenticated successfully");
          next();
        }
      }
    );
  } else {
    next(createHttpError(401, "Unauthorized: No role found in cookies"));
  }
}
