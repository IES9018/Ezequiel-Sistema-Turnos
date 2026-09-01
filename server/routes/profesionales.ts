import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { ok, fail } from "../utils/responses.js";

const router = Router();

router.get("/", async (_req, res) => {
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

router.get("/:id", async (req, res) => {
  try {
    const profesional = await prisma.profesional.findUnique({
      where: { id: req.params.id },
      include: { disponibilidad: true },
    });
    if (!profesional) return fail(res, "Profesional no encontrado", 404);
    return ok(res, profesional);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al obtener profesional", 500);
  }
});

router.post("/", async (req, res) => {
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

router.put("/:id", async (req, res) => {
  try {
    const { nombre, email, especialidad, activo } = req.body;
    const profesional = await prisma.profesional.update({
      where: { id: req.params.id },
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

router.delete("/:id", async (req, res) => {
  try {
    await prisma.profesional.delete({ where: { id: req.params.id } });
    return ok(res, { id: req.params.id });
  } catch (err) {
    console.error(err);
    return fail(res, "Error al eliminar profesional", 500);
  }
});

router.get("/:id/disponibilidad", async (req, res) => {
  try {
    const disponibilidad = await prisma.disponibilidad.findMany({
      where: { profesionalId: req.params.id },
      orderBy: [{ dia: "asc" }, { horaInicio: "asc" }],
    });
    return ok(res, disponibilidad);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al obtener disponibilidad", 500);
  }
});

router.put("/:id/disponibilidad", async (req, res) => {
  try {
    const { bloques } = req.body;

    if (!Array.isArray(bloques)) {
      return fail(res, "bloques debe ser un array");
    }

    await prisma.disponibilidad.deleteMany({ where: { profesionalId: req.params.id } });

    const creados = await prisma.$transaction(
      bloques.map((b: { dia: string; horaInicio: string; horaFin: string }) =>
        prisma.disponibilidad.create({
          data: {
            profesionalId: req.params.id,
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
