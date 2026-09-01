import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { fail } from "../utils/responses.js";

const JWT_SECRET = process.env.JWT_SECRET || "cambiar-esta-clave-en-produccion";

export interface AuthPayload {
  id: string;
  rol: string;
}

export interface AuthedRequest {
  userId?: string;
  userRol?: string;
}

export function authRequired(req: AuthedRequest & Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return fail(res, "Token no proporcionado", 401);
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.userId = payload.id;
    req.userRol = payload.rol;
    return next();
  } catch {
    return fail(res, "Token inválido o expirado", 401);
  }
}

export function adminRequired(req: AuthedRequest & Request, res: Response, next: NextFunction) {
  if (req.userRol !== "ADMIN") {
    return fail(res, "Requiere permisos de administrador", 403);
  }
  return next();
}
