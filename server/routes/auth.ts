import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client.js";
import { ok, fail } from "../utils/responses.js";
import { getJwtSecret } from "../config/env.js";
import { createRateLimiter } from "../middlewares/rate-limit.js";

const router = Router();

const loginLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 5,
  message: "Demasiados intentos de inicio de sesión, probá en un minuto.",
});

const registerLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
  message: "Demasiados registros desde esta IP, probá en un minuto.",
});

router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return fail(res, "nombre, email y password son obligatorios");
    }

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return fail(res, "El email ya está registrado");

    const hash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: { nombre, email, password: hash },
    });

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, getJwtSecret(), {
      expiresIn: "7d",
    });

    return ok(
      res,
      {
        token,
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      },
      201,
    );
  } catch (err) {
    console.error(err);
    return fail(res, "Error al registrar usuario", 500);
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return fail(res, "email y password son obligatorios");
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return fail(res, "Credenciales inválidas", 401);

    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) return fail(res, "Credenciales inválidas", 401);

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, getJwtSecret(), {
      expiresIn: "7d",
    });

    return ok(res, {
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });
  } catch (err) {
    console.error(err);
    return fail(res, "Error al iniciar sesión", 500);
  }
});

export default router;
