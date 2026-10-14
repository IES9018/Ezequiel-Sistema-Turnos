import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../src/services/api.js";

describe("servicio api (cliente)", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  const sesion = {
    token: "abc.def.ghi",
    usuario: { id: "c1", nombre: "Martina", email: "m@x.com", rol: "CLIENTE" },
  };

  function mockFetchOk(body: unknown) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => body }),
    );
  }

  it("login() llama a /api/auth/login con el cuerpo correcto", async () => {
    mockFetchOk({ success: true, data: sesion });
    const res = await api.login("m@x.com", "123456");
    expect(res.token).toBe("abc.def.ghi");
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toBe("/api/auth/login");
  });

  it("login() envía el token cuando ya hay sesión", async () => {
    localStorage.setItem("token", "abc.def.ghi");
    mockFetchOk({ success: true, data: sesion });
    await api.login("m@x.com", "123456");
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer abc.def.ghi");
  });

  it("register() envía nombre, email y password a /api/auth/register", async () => {
    mockFetchOk({ success: true, data: sesion });
    await api.register("Martina", "m@x.com", "123456");
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/auth/register");
    expect(JSON.parse(init.body as string)).toEqual({ nombre: "Martina", email: "m@x.com", password: "123456" });
  });

  it("propaga el mensaje de error del envelope { success:false, error }", async () => {
    mockFetchOk({ success: false, error: "contraseña incorrecta" });
    await expect(api.login("m@x.com", "mala")).rejects.toThrow("contraseña incorrecta");
  });

  it("levanta error con el código HTTP cuando la respuesta no es OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );
    await expect(api.servicios()).rejects.toThrow("Error 500");
  });
});