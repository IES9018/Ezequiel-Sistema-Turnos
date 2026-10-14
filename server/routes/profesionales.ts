import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { ok, fail } from "../utils/responses.js";
import { rutaParam } from "../utils/http.js";
import { authRequired, adminRequired } from "../middlewares/auth.js";

const router = Router();

router.get("/", authRequired, async (_req, res) => {
  try {
    const profesionales = await prisma.profesional.findMany({
      include: { disponibilidad: true },
      orderBy: { nombre: "asc" },
    });
    return ok(res, profesionales);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al obtener profesionales", 500);
  }
});

router.get("/:id", authRequired, async (req, res) => {
  try {
    const profesional = await prisma.profesional.findUnique({
      where: { id: rutaParam(req, "id") },
      include: { disponibilidad: true },
    });
    if (!profesional) return fail(res, "Profesional no encontrado", 404);
    return ok(res, profesional);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al obtener profesional", 500);
  }
});

router.post("/", authRequired, adminRequired, async (req, res) => {
  try {
    const { nombre, email, especialidad } = req.body;

    if (!nombre || !email || !especialidad) {
      return fail(res, "nombre, email y especialidad son obligatorios");
    }

    const profesional = await prisma.profesional.create({
      data: { nombre, email, especialidad },
    });
    return ok(res, profesional, 201);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al crear profesional", 500);
  }
});

router.put("/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const { nombre, email, especialidad, activo } = req.body;
    const profesional = await prisma.profesional.update({
      where: { id: rutaParam(req, "id") },
      data: {
        nombre: nombre ?? undefined,
        email: email ?? undefined,
        especialidad: especialidad ?? undefined,
        activo: activo ?? undefined,
      },
    });
    return ok(res, profesional);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al actualizar profesional", 500);
  }
});

router.delete("/:id", authRequired, adminRequired, async (req, res) => {
  try {
    await prisma.profesional.delete({ where: { id: rutaParam(req, "id") } });
    return ok(res, { id: rutaParam(req, "id") });
  } catch (err) {
    console.error(err);
    return fail(res, "Error al eliminar profesional", 500);
  }
});

router.get("/:id/disponibilidad", authRequired, async (req, res) => {
  try {
    const disponibilidad = await prisma.disponibilidad.findMany({
      where: { profesionalId: rutaParam(req, "id") },
      orderBy: [{ dia: "asc" }, { horaInicio: "asc" }],
    });
    return ok(res, disponibilidad);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al obtener disponibilidad", 500);
  }
});

router.put("/:id/disponibilidad", authRequired, adminRequired, async (req, res) => {
  try {
    const { bloques } = req.body;

    if (!Array.isArray(bloques)) {
      return fail(res, "bloques debe ser un array");
    }

    await prisma.disponibilidad.deleteMany({ where: { profesionalId: rutaParam(req, "id") } });

    const creados = await prisma.$transaction(
      bloques.map((b: { dia: string; horaInicio: string; horaFin: string }) =>
        prisma.disponibilidad.create({
          data: {
            profesionalId: rutaParam(req, "id"),
            dia: b.dia as never,
            horaInicio: b.horaInicio,
            horaFin: b.horaFin,
          },
        }),
      ),
    );

    return ok(res, creados);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al actualizar disponibilidad", 500);
  }
});

export default router;
