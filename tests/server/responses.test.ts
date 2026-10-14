import { describe, expect, it } from "vitest";
import { ok, fail } from "../../server/utils/responses.js";
import type { Response } from "express";

function fakeRes() {
  const tr = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      tr.statusCode = code;
      return tr;
    },
    json(data: unknown) {
      tr.body = data;
      return tr;
    },
  };
  return tr as unknown as Response;
}

describe("respuestas estandarizadas (envelope)", () => {
  it("ok() devuelve { success:true, data } con status 200 por defecto", () => {
    const res = fakeRes();
    ok(res, { id: "t1" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: { id: "t1" } });
  });

  it("ok() acepta un status explícito (201)", () => {
    const res = fakeRes();
    ok(res, { id: "t1" }, 201);
    expect(res.statusCode).toBe(201);
  });

  it("fail() devuelve { success:false, error } con status 400 por defecto", () => {
    const res = fakeRes();
    fail(res, "algo salió mal");
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ success: false, error: "algo salió mal" });
  });

  it("fail() respeta un status distinto al default", () => {
    const res = fakeRes();
    fail(res, "no encontrado", 404);
    expect(res.statusCode).toBe(404);
  });
});