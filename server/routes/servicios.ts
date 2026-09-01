import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { ok, fail } from "../utils/responses.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const servicios = await prisma.servicio.findMany({
      orderBy: { nombre: "asc" },
    });
    return ok(res, servicios);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al obtener servicios", 500);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const servicio = await prisma.servicio.findUnique({
      where: { id: req.params.id },
    });
    if (!servicio) return fail(res, "Servicio no encontrado", 404);
    return ok(res, servicio);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al obtener servicio", 500);
  }
});

router.post("/", async (req, res) => {
  try {
    const { nombre, duracionMinutos, precio } = req.body;

    if (!nombre || typeof duracionMinutos !== "number" || typeof precio !== "number") {
      return fail(res, "nombre, duracionMinutos y precio son obligatorios");
    }

    const servicio = await prisma.servicio.create({
      data: { nombre, duracionMinutos, precio },
    });
    return ok(res, servicio, 201);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al crear servicio", 500);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { nombre, duracionMinutos, precio, activo } = req.body;
    const servicio = await prisma.servicio.update({
      where: { id: req.params.id },
      data: {
        nombre: nombre ?? undefined,
        duracionMinutos: duracionMinutos ?? undefined,
        precio: precio ?? undefined,
        activo: activo ?? undefined,
      },
    });
    return ok(res, servicio);
  } catch (err) {
    console.error(err);
    return fail(res, "Error al actualizar servicio", 500);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.servicio.delete({ where: { id: req.params.id } });
    return ok(res, { id: req.params.id });
  } catch (err) {
    console.error(err);
    return fail(res, "Error al eliminar servicio", 500);
  }
});

export default router;
