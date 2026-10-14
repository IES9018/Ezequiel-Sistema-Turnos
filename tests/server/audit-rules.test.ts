import { describe, expect, it } from "vitest";
import { buildCambioEstado } from "../../server/utils/audit-rules.js";

describe("buildCambioEstado (traza de auditoría, T-04)", () => {
  it("arma la entrada con usuario, turno y estado anterior→nuevo", () => {
    expect(buildCambioEstado("u1", "t1", "PENDIENTE", "CANCELADO")).toEqual({
      usuarioId: "u1",
      turnoId: "t1",
      accion: "CAMBIO_ESTADO",
      estadoAnterior: "PENDIENTE",
      estadoNuevo: "CANCELADO",
    });
  });

  it("marca la acción como CAMBIO_ESTADO", () => {
    expect(buildCambioEstado("u1", "t1", "PENDIENTE", "CONFIRMADO").accion).toBe("CAMBIO_ESTADO");
  });
});
