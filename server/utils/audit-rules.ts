export interface AuditEntry {
  usuarioId: string;
  turnoId: string;
  accion: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
}

export function buildCambioEstado(
  usuarioId: string,
  turnoId: string,
  estadoAnterior: string,
  estadoNuevo: string,
): AuditEntry {
  return {
    usuarioId,
    turnoId,
    accion: "CAMBIO_ESTADO",
    estadoAnterior,
    estadoNuevo,
  };
}
