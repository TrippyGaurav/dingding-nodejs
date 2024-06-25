import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { config } from "../config/config";

// Extend the Request interface to include the isPlayer property
declare module "express-serve-static-core" {
  interface Request {
    isPlayer?: boolean;
  }
}

const determineOrigin = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.get("origin") || req.get("referer") || "";

  if (origin === config.platform_url) {
    req.isPlayer = true;
  } else if (origin === config.crm_url) {
    req.isPlayer = false;
  } else {
    return next(createHttpError(400, "Invalid origin"));
  }

  next();
};
export default determineOrigin;
