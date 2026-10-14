import { describe, expect, it } from "vitest";
import { calcularHoraFin, seSuperponen } from "../../server/utils/turnos-rules.js";

describe("calcularHoraFin", () => {
  it("suma minutos dentro de la misma hora", () => {
    expect(calcularHoraFin("18:00", 30)).toBe("18:30");
  });

  it("desplaza la hora cuando la duración supera los minutos restantes", () => {
    expect(calcularHoraFin("18:30", 45)).toBe("19:15");
  });

  it("vuelve a 00:xx cuando el turno cruza la medianoche (fix S1)", () => {
    expect(calcularHoraFin("23:30", 60)).toBe("00:30");
  });

  it("cruza la medianoche con minutos", () => {
    expect(calcularHoraFin("23:45", 30)).toBe("00:15");
  });

  it("con duración cero devuelve la misma hora", () => {
    expect(calcularHoraFin("10:00", 0)).toBe("10:00");
  });

  it("lanza error para un formato de hora inválido", () => {
    expect(() => calcularHoraFin("25:99", 30)).toThrow(/horaInicio inválida/);
    expect(() => calcularHoraFin("18hs", 30)).toThrow(/horaInicio inválida/);
  });
});

describe("seSuperponen", () => {
  it("detecta franjas que se cruzan parcialmente", () => {
    expect(
      seSuperponen({ horaInicio: "10:00", horaFin: "11:00" }, { horaInicio: "10:30", horaFin: "11:30" }),
    ).toBe(true);
  });

  it("detecta un turno contenido dentro de otro", () => {
    expect(
      seSuperponen({ horaInicio: "09:00", horaFin: "12:00" }, { horaInicio: "10:00", horaFin: "10:30" }),
    ).toBe(true);
  });

  it("detecta franjas con el mismo horario de inicio", () => {
    expect(
      seSuperponen({ horaInicio: "10:00", horaFin: "10:30" }, { horaInicio: "10:00", horaFin: "11:00" }),
    ).toBe(true);
  });

  it("considera no superpuestos los bordes exactos contiguos", () => {
    expect(
      seSuperponen({ horaInicio: "10:00", horaFin: "10:30" }, { horaInicio: "10:30", horaFin: "11:00" }),
    ).toBe(false);
  });

  it("considera no superpuestas franjas separadas por un hueco", () => {
    expect(
      seSuperponen({ horaInicio: "10:00", horaFin: "10:30" }, { horaInicio: "11:00", horaFin: "11:30" }),
    ).toBe(false);
  });
});