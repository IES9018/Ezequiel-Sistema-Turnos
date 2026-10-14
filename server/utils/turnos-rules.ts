export interface Franja {
  horaInicio: string;
  horaFin: string;
}

export function calcularHoraFin(horaInicio: string, duracionMinutos: number): string {
  const m = /^(\d{2}):(\d{2})$/.exec(horaInicio);
  if (!m) throw new Error(`horaInicio inválida: "${horaInicio}"`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) throw new Error(`horaInicio inválida: "${horaInicio}"`);
  const totalMin = h * 60 + min + duracionMinutos;
  const horas = Math.floor(totalMin / 60) % 24;
  const minutos = totalMin % 60;
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

export function seSuperponen(a: Franja, b: Franja): boolean {
  return a.horaInicio < b.horaFin && b.horaInicio < a.horaFin;
}

export interface TurnoPropiedad {
  clienteId: string;
}

export function puedeCambiarEstado(
  rol: string,
  usuarioId: string,
  turno: TurnoPropiedad,
  nuevoEstado: string,
): boolean {
  if (rol === "ADMIN") return true;
  return rol === "CLIENTE" && turno.clienteId === usuarioId && nuevoEstado === "CANCELADO";
}