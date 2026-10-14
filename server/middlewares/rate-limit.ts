import type { Request, Response, NextFunction } from "express";
import { fail } from "../utils/responses.js";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface Registro {
  count: number;
  resetAt: number;
}

export interface ResultadoLimite {
  permitido: boolean;
  registro: Registro;
}

export function evaluarLimite(
  registro: Registro | undefined,
  ahora: number,
  windowMs: number,
  max: number,
): ResultadoLimite {
  if (!registro || registro.resetAt <= ahora) {
    return { permitido: true, registro: { count: 1, resetAt: ahora + windowMs } };
  }
  const count = registro.count + 1;
  return { permitido: count <= max, registro: { count, resetAt: registro.resetAt } };
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = "Demasiadas solicitudes, intentá más tarde." } = options;
  const hits = new Map<string, Registro>();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? req.socket.remoteAddress ?? "desconocido";
    const ahora = Date.now();
    const { permitido, registro } = evaluarLimite(hits.get(key), ahora, windowMs, max);

    hits.set(key, registro);

    if (!permitido) {
      res.setHeader("Retry-After", String(Math.ceil((registro.resetAt - ahora) / 1000)));
      return fail(res, message, 429);
    }
    return next();
  };
}
