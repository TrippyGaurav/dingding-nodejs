import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { config } from "../config/config";

// Extend the Request interface to include the isPlayer property
declare module "express-serve-static-core" {
  interface Request {
    isPlayer?: boolean;
  }
}

// Utility function to extract base origin from URL
const getBaseOrigin = (url: string): string => {
  try {
    const { protocol, hostname, port } = new URL(url);
    return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
  } catch (err) {
    return "";
  }
};

const determineOrigin = (req: Request, res: Response, next: NextFunction) => {
  const originHeader = req.get("origin") || req.get("referer") || "";
  const origin = getBaseOrigin(originHeader);

  console.log("Received origin:", origin);
  console.log("Platform URL:", config.platform_url);
  console.log("CRM URL:", config.crm_url);

  if (origin === getBaseOrigin(config.platform_url)) {
    req.isPlayer = true;
  } else if (origin === getBaseOrigin(config.crm_url)) {
    req.isPlayer = false;
  } else {
    return next(createHttpError(400, "Invalid origin"));
  }

  next();
};

export default determineOrigin;
