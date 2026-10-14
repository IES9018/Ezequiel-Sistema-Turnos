import type { Request } from "express";

export function rutaParam(req: Request, nombre: string): string {
  const valor = req.params[nombre];
  if (Array.isArray(valor)) return valor[0] ?? "";
  return valor ?? "";
}
