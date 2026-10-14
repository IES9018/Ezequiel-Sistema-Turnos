import { prisma } from "../prisma/client.js";
import type { AuditEntry } from "../utils/audit-rules.js";

export { buildCambioEstado } from "../utils/audit-rules.js";
export type { AuditEntry } from "../utils/audit-rules.js";

export async function registrarAuditoria(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch (err) {
    console.error("No se pudo registrar la traza de auditoría:", err);
  }
}
