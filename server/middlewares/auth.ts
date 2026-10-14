import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { fail } from "../utils/responses.js";
import { getJwtSecret } from "../config/env.js";

export interface AuthPayload {
  id: string;
  rol: string;
}

export interface AuthedRequest {
  userId?: string;
  userRol?: string;
}

export type AuthedReq = Request & AuthedRequest;

export const authRequired: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    fail(res, "Token no proporcionado", 401);
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthPayload;
    const authed = req as AuthedReq;
    authed.userId = payload.id;
    authed.userRol = payload.rol;
    next();
  } catch {
    fail(res, "Token inválido o expirado", 401);
  }
};

export function requireRole(rol: string): RequestHandler {
  return (req, res, next) => {
    if ((req as AuthedReq).userRol !== rol) {
      fail(res, "No tenés permisos para esta acción", 403);
      return;
    }
    next();
  };
}

export const adminRequired = requireRole("ADMIN");
