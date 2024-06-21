import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
export const clients: Map<string, WebSocket> = new Map();
import createHttpError from "http-errors";
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
  userName: string;
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

export function validatePaginationParams(params: {
  page: number;
  limit: number;
}) {
  const { page, limit } = params;

  if (!Number.isInteger(page) || page < 1) {
    throw createHttpError(
      400,
      "Page must be an integer greater than or equal to 1."
    );
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw createHttpError(
      400,
      "Limit must be an integer greater than or equal to 1."
    );
  }

  return { page, limit };
}
export function getPaginationMetadata(
  page: number,
  limit: number,
  totalItems: number
) {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
