import { Router, type Request } from "express";
import { prisma } from "../prisma/client.js";
import { ok, fail } from "../utils/responses.js";
import { rutaParam } from "../utils/http.js";
import { calcularHoraFin, seSuperponen, puedeCambiarEstado } from "../utils/turnos-rules.js";
import { authRequired, adminRequired, type AuthedRequest } from "../middlewares/auth.js";
import { createRateLimiter } from "../middlewares/rate-limit.js";
import { buildCambioEstado, registrarAuditoria } from "../services/audit.js";

const router = Router();

const reservaLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  message: "Demasiadas reservas seguidas, probá en un minuto.",
});

const includeTurno = {
  cliente: { select: { id: true, nombre: true, email: true } },
  profesional: { select: { id: true, nombre: true } },
  servicio: { select: { id: true, nombre: true, precio: true } },
} as const;

router.get("/", authRequired, async (req, res) => {
  const authed = req as Request & AuthedRequest;
  try {
    const fecha = typeof req.query.fecha === "string" ? req.query.fecha : undefined;
    const esAdmin = authed.userRol === "ADMIN";

    const turnos = await prisma.turno.findMany({
      where: {
        ...(esAdmin ? {} : { clienteId: authed.userId }),
        ...(fecha ? { fecha: new Date(fecha) } : {}),
      },
      include: includeTurno,
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    });
    return ok(res, turnos);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al obtener turnos", 500);
  }
});

router.get("/:id", authRequired, async (req, res) => {
  const authed = req as Request & AuthedRequest;
  try {
    const turno = await prisma.turno.findUnique({
      where: { id: rutaParam(req, "id") },
      include: includeTurno,
    });
    if (!turno) return fail(res, "Turno no encontrado", 404);
    if (authed.userRol !== "ADMIN" && turno.clienteId !== authed.userId) {
      return fail(res, "No tenés permisos para ver este turno", 403);
    }
    return ok(res, turno);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al obtener turno", 500);
  }
});

router.post("/", authRequired, reservaLimiter, async (req, res) => {
  const authed = req as Request & AuthedRequest;
  try {
    const clienteId = authed.userId;
    const { profesionalId, servicioId, fecha, horaInicio } = req.body;

    if (
      !clienteId ||
      !profesionalId ||
      !servicioId ||
      !fecha ||
      typeof horaInicio !== "string"
    ) {
      return fail(res, "profesionalId, servicioId, fecha y horaInicio son obligatorios");
    }

    const [servicio, profesional] = await Promise.all([
      prisma.servicio.findUnique({ where: { id: servicioId } }),
      prisma.profesional.findUnique({ where: { id: profesionalId } }),
    ]);

    if (!servicio) return fail(res, "Servicio no encontrado", 404);
    if (!profesional) return fail(res, "Profesional no encontrado", 404);

    const horaFin = calcularHoraFin(horaInicio, servicio.duracionMinutos);

    const turnosDelDia = await prisma.turno.findMany({
      where: {
        profesionalId,
        fecha: new Date(fecha),
        estado: { in: ["PENDIENTE", "CONFIRMADO"] },
      },
      select: { horaInicio: true, horaFin: true },
    });

    const conflicto = turnosDelDia.some((t) =>
      seSuperponen(
        { horaInicio, horaFin },
        { horaInicio: t.horaInicio, horaFin: t.horaFin },
      ),
    );

    if (conflicto) {
      return fail(res, "El profesional ya tiene un turno en ese horario", 409);
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

router.patch("/:id/estado", authRequired, async (req, res) => {
  const authed = req as Request & AuthedRequest;
  try {
    const { estado } = req.body;

    const permitidos = ["PENDIENTE", "CONFIRMADO", "CANCELADO", "COMPLETADO"];
    if (!permitidos.includes(estado)) {
      return fail(res, `estado debe ser uno de: ${permitidos.join(", ")}`);
    }

    const actual = await prisma.turno.findUnique({ where: { id: rutaParam(req, "id") } });
    if (!actual) return fail(res, "Turno no encontrado", 404);

    const usuarioId = authed.userId ?? "";
    const rol = authed.userRol ?? "";
    if (!puedeCambiarEstado(rol, usuarioId, actual, estado)) {
      return fail(res, "No tenés permisos para cambiar el estado de este turno", 403);
    }

    const turno = await prisma.turno.update({
      where: { id: rutaParam(req, "id") },
      data: { estado },
    });

    await registrarAuditoria(
      buildCambioEstado(usuarioId, turno.id, actual.estado, turno.estado),
    );

    return ok(res, turno);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al actualizar turno", 500);
  }
});

router.delete("/:id", authRequired, adminRequired, async (req, res) => {
  try {
    await prisma.turno.delete({ where: { id: rutaParam(req, "id") } });
    return ok(res, { id: rutaParam(req, "id") });
  } catch (err) {
    console.error(err);
    return fail(res, "Error al eliminar turno", 500);
  }
});

export default router;
