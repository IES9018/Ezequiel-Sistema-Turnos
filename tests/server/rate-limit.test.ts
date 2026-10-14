import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { evaluarLimite, createRateLimiter } from "../../server/middlewares/rate-limit.js";

interface FakeRes {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  status(code: number): FakeRes;
  json(data: unknown): FakeRes;
  setHeader(key: string, value: string): FakeRes;
}

function fakeRes(): FakeRes & Response {
  const tr: FakeRes = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) {
      tr.statusCode = code;
      return tr;
    },
    json(data) {
      tr.body = data;
      return tr;
    },
    setHeader(key, value) {
      tr.headers[key] = value;
      return tr;
    },
  };
  return tr as FakeRes & Response;
}

function fakeReq(ip: string): Request {
  return { ip, socket: { remoteAddress: ip } } as unknown as Request;
}

describe("evaluarLimite (regla pura)", () => {
  it("permite el primer intento y abre una ventana nueva", () => {
    const { permitido, registro } = evaluarLimite(undefined, 1000, 60000, 3);
    expect(permitido).toBe(true);
    expect(registro).toEqual({ count: 1, resetAt: 61000 });
  });

  it("permite hasta el máximo dentro de la ventana", () => {
    let reg = evaluarLimite(undefined, 1000, 60000, 3).registro;
    reg = evaluarLimite(reg, 1001, 60000, 3).registro;
    const tercero = evaluarLimite(reg, 1002, 60000, 3);
    expect(tercero.permitido).toBe(true);
    expect(tercero.registro.count).toBe(3);
  });

  it("bloquea al superar el máximo sin extender la ventana", () => {
    const reg = { count: 3, resetAt: 61000 };
    const r = evaluarLimite(reg, 5000, 60000, 3);
    expect(r.permitido).toBe(false);
    expect(r.registro).toEqual({ count: 4, resetAt: 61000 });
  });

  it("reinicia cuando la ventana ya expiró", () => {
    const reg = { count: 3, resetAt: 2000 };
    const r = evaluarLimite(reg, 5000, 60000, 3);
    expect(r.permitido).toBe(true);
    expect(r.registro).toEqual({ count: 1, resetAt: 65000 });
  });
});

describe("createRateLimiter (middleware)", () => {
  it("deja pasar por debajo del límite y bloquea con 429 + Retry-After", () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 2 });
    const next = vi.fn();
    const req = fakeReq("1.2.3.4");

    limiter(req, fakeRes(), next);
    limiter(req, fakeRes(), next);
    expect(next).toHaveBeenCalledTimes(2);

    const res = fakeRes();
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(res.statusCode).toBe(429);
    expect(res.body).toMatchObject({ success: false });
    expect(res.headers["Retry-After"]).toBeDefined();
  });

  it("cuenta por IP de forma independiente", () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 1 });
    const next = vi.fn();
    limiter(fakeReq("1.1.1.1"), fakeRes(), next);
    limiter(fakeReq("2.2.2.2"), fakeRes(), next);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
