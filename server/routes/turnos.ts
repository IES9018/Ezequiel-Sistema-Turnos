import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { ok, fail } from "../utils/responses.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const turnos = await prisma.turno.findMany({
      include: {
        cliente: { select: { id: true, nombre: true, email: true } },
        profesional: { select: { id: true, nombre: true } },
        servicio: { select: { id: true, nombre: true, precio: true } },
      },
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    });
    return ok(res, turnos);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al obtener turnos", 500);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const turno = await prisma.turno.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: { select: { id: true, nombre: true, email: true } },
        profesional: { select: { id: true, nombre: true } },
        servicio: { select: { id: true, nombre: true, precio: true } },
      },
    });
    if (!turno) return fail(res, "Turno no encontrado", 404);
    return ok(res, turno);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al obtener turno", 500);
  }
});

router.post("/", async (req, res) => {
  try {
    const { clienteId, profesionalId, servicioId, fecha, horaInicio } = req.body;

    if (
      !clienteId ||
      !profesionalId ||
      !servicioId ||
      !fecha ||
      typeof horaInicio !== "string"
    ) {
      return fail(res, "clienteId, profesionalId, servicioId, fecha y horaInicio son obligatorios");
    }

    const [servicio, profesional] = await Promise.all([
      prisma.servicio.findUnique({ where: { id: servicioId } }),
      prisma.profesional.findUnique({ where: { id: profesionalId } }),
    ]);

    if (!servicio) return fail(res, "Servicio no encontrado", 404);
    if (!profesional) return fail(res, "Profesional no encontrado", 404);

    const horaFin = calcularHoraFin(horaInicio, servicio.duracionMinutos);

    const conflicto = await prisma.turno.findFirst({
      where: {
        profesionalId,
        fecha: new Date(fecha),
        estado: { in: ["PENDIENTE", "CONFIRMADO"] },
        OR: [
          { horaInicio: { lt: horaFin }, horaFin: { gt: horaInicio } },
          { horaInicio: horaInicio },
        ],
      },
    });

    if (conflicto) {
      return fail(res, "El profesional ya tiene un turno en ese horario");
    }

    const turno = await prisma.turno.create({
      data: {
        clienteId,
        profesionalId,
        servicioId,
        fecha: new Date(fecha),
        horaInicio,
        horaFin,
      },
    });
    return ok(res, turno, 201);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al crear turno", 500);
  }
});

router.patch("/:id/estado", async (req, res) => {
  try {
    const { estado } = req.body;

    const permitidos = ["PENDIENTE", "CONFIRMADO", "CANCELADO", "COMPLETADO"];
    if (!permitidos.includes(estado)) {
      return fail(res, `estado debe ser uno de: ${permitidos.join(", ")}`);
    }

    const turno = await prisma.turno.update({
      where: { id: req.params.id },
      data: { estado },
    });
    return ok(res, turno);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al actualizar turno", 500);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.turno.delete({ where: { id: req.params.id } });
    return ok(res, { id: req.params.id });
  } catch (err) {
    console.error(err);
    return fail(res, "Error al eliminar turno", 500);
  }
});

function calcularHoraFin(horaInicio: string, duracionMinutos: number): string {
  const [hStr, mStr] = horaInicio.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const totalMin = h * 60 + m + duracionMinutos;
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

export default router;
