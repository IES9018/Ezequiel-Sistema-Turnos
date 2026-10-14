import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authRequired, adminRequired } from "../../server/middlewares/auth.js";

interface FakeRes {
  statusCode: number;
  body: unknown;
  status(code: number): FakeRes;
  json(data: unknown): FakeRes;
}

function fakeRes(): FakeRes & Response {
  const tr: FakeRes = {
    statusCode: 200,
    body: undefined,
    status(code) {
      tr.statusCode = code;
      return tr;
    },
    json(data) {
      tr.body = data;
      return tr;
    },
  };
  return tr as FakeRes & Response;
}

function fakeReq(authorization?: string): Request & { userId?: string; userRol?: string } {
  return { headers: { authorization } } as unknown as Request & {
    userId?: string;
    userRol?: string;
  };
}

beforeEach(() => {
  process.env.JWT_SECRET = "clave-de-prueba";
});

describe("authRequired", () => {
  it("rechaza sin header Bearer con 401", () => {
    const res = fakeRes();
    const next = vi.fn();
    authRequired(fakeReq(), res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("acepta un token válido e inyecta identidad y rol", () => {
    const token = jwt.sign({ id: "u1", rol: "ADMIN" }, "clave-de-prueba");
    const req = fakeReq(`Bearer ${token}`);
    const res = fakeRes();
    const next = vi.fn();

    authRequired(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBe("u1");
    expect(req.userRol).toBe("ADMIN");
  });

  it("rechaza un token inválido con 401", () => {
    const res = fakeRes();
    const next = vi.fn();
    authRequired(fakeReq("Bearer token.falso.invalido"), res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rechaza un token firmado con otra clave", () => {
    const token = jwt.sign({ id: "u1", rol: "ADMIN" }, "otra-clave");
    const res = fakeRes();
    const next = vi.fn();
    authRequired(fakeReq(`Bearer ${token}`), res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("adminRequired (autorización por rol)", () => {
  it("permite continuar a un ADMIN", () => {
    const req = fakeReq() as Request & { userRol?: string };
    req.userRol = "ADMIN";
    const res = fakeRes();
    const next = vi.fn();
    adminRequired(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it("bloquea a un CLIENTE con 403 (mitiga elevación de privilegios)", () => {
    const req = fakeReq() as Request & { userRol?: string };
    req.userRol = "CLIENTE";
    const res = fakeRes();
    const next = vi.fn();
    adminRequired(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});
