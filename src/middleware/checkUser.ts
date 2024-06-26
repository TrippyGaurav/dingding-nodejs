import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, DecodedToken } from "../utils/utils";
import createHttpError from "http-errors";

export function checkUser(req: Request, res: Response, next: NextFunction) {
  const cookie = req.headers.cookie
    ?.split("; ")
    .find((row) => row.startsWith("userToken="))
    ?.split("=")[1];

  if (cookie) {
    jwt.verify(
      cookie,
      process.env.JWT_SECRET!,
      (err, decoded: DecodedToken | undefined) => {
        if (err) {
          console.error("Token verification failed:", err.message);
          return res.status(401).json({ error: "You are not authenticated" });
        } else {
          const _req = req as AuthRequest;
          _req.user = {
            username: decoded!.username,
            role: decoded!.role,
          };
          next();
        }
      }
    );
  } else {
    next(createHttpError(401, "Unauthorized: No role found in cookies"));
  }
}
