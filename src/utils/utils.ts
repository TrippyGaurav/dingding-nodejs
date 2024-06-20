import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export const clients: Map<string, WebSocket> = new Map();

export enum MESSAGEID {
  AUTH = "AUTH",
  SPIN = "SPIN",
  GAMBLE = "GAMBLE",
  GENRTP = "GENRTP",
}

export const enum MESSAGETYPE {
  ALERT = "alert",
  MESSAGE = "message",
  ERROR = "internalError",
}

export interface AuthRequest extends Request {
  userId: string;
  userRole: string;
}

export interface CustomJwtPayload extends JwtPayload {
  role: string;
}

export const rolesHierarchy = {
  company: ["master"],
  master: ["distributor"],
  distributor: ["subdistributor"],
  subdistributor: ["store"],
  store: ["player"],
};
