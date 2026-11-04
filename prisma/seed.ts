import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordAdmin = await bcrypt.hash("admin1234", 10);
  const passwordCliente = await bcrypt.hash("cliente1234", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@turnos.test" },
    update: { rol: "ADMIN" },
    create: {
      nombre: "Admin Demo",
      email: "admin@turnos.test",
      password: passwordAdmin,
      rol: "ADMIN",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "cliente@turnos.test" },
    update: {},
    create: {
      nombre: "Cliente Demo",
      email: "cliente@turnos.test",
      password: passwordCliente,
    },
  });

  const servicios = [
    { nombre: "Corte", duracionMinutos: 30, precio: 15 },
    { nombre: "Barba", duracionMinutos: 20, precio: 10 },
    { nombre: "Corte + Barba", duracionMinutos: 50, precio: 22 },
  ];
  for (const servicio of servicios) {
    const existe = await prisma.servicio.findFirst({ where: { nombre: servicio.nombre } });
    if (!existe) await prisma.servicio.create({ data: servicio });
  }

  const profesional = await prisma.profesional.upsert({
    where: { email: "carlos@turnos.test" },
    update: {},
    create: { nombre: "Carlos", email: "carlos@turnos.test", especialidad: "Barbero" },
  });

  const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"] as const;
  for (const dia of dias) {
    await prisma.disponibilidad.upsert({
      where: { profesionalId_dia: { profesionalId: profesional.id, dia } },
      update: {},
      create: {
        profesionalId: profesional.id,
        dia,
        horaInicio: "09:00",
        horaFin: "19:00",
      },
    });
  }

  console.log("Seed listo:");
  console.log("  ADMIN   admin@turnos.test / admin1234");
  console.log("  CLIENTE cliente@turnos.test / cliente1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
