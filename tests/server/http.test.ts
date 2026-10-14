import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { rutaParam } from "../../server/utils/http.js";

function reqConParams(params: Record<string, string | string[] | undefined>): Request {
  return { params } as unknown as Request;
}

describe("rutaParam", () => {
  it("devuelve el valor string del parámetro", () => {
    expect(rutaParam(reqConParams({ id: "abc" }), "id")).toBe("abc");
  });

  it("devuelve cadena vacía si el parámetro falta", () => {
    expect(rutaParam(reqConParams({}), "id")).toBe("");
  });

  it("toma el primer valor si Express entrega un arreglo", () => {
    expect(rutaParam(reqConParams({ id: ["a", "b"] }), "id")).toBe("a");
  });
});
