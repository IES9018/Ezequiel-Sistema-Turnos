# Sistema de Turnos — Peluquería/Barbería

Aplicación web para gestionar turnos de una peluquería/barbería: reserva online de servicios, gestión de agenda de profesionales y panel administrativo.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React + Vite + TypeScript + TailwindCSS |
| **Backend** | Node.js + Express + TypeScript |
| **Base de datos** | PostgreSQL + Prisma ORM |
| **Autenticación** | JWT + bcrypt |

## Estructura

```
├── client/             # Frontend React (Vite)
│   └── src/            # Componentes, páginas, servicios, tipos
├── server/              # Backend Express
│   ├── index.ts         # Punto de entrada
│   ├── routes/          # Definición de rutas
│   ├── controllers/     # Manejo de requests
│   ├── services/        # Lógica de negocio
│   ├── middlewares/     # Auth, validación, errores
│   └── prisma/          # Schema y migraciones
├── docs/
│   ├── adr/             # Decisiones arquitectónicas
│   └── auditoria/       # Informes de auditoría
├── SPEC.md              # Especificación del proyecto
└── .opencoderules       # Arnés de IA
```

## Requisitos

- Node.js 22+
- PostgreSQL 16+
- npm

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar DATABASE_URL con tus credenciales de PostgreSQL

# 3. Inicializar base de datos
npm run db:generate
npm run db:push

# 4. Iniciar servidor de desarrollo
npm run dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (watch mode) |
| `npm run build` | Compilar TypeScript |
| `npm run start` | Ejecutar versión compilada |
| `npm run db:generate` | Generar cliente Prisma |
| `npm run db:push` | Sincronizar schema con la DB |
| `npm run db:migrate` | Crear migración |
| `npm run db:studio` | Abrir Prisma Studio |

## Documentación

- [Especificación del proyecto (SPEC.md)](SPEC.md)
- [Decisiones arquitectónicas (ADRs)](docs/adr/)
- [Informes de auditoría](docs/auditoria/)

## 🗓️ Gestión

Tablero del sprint: [Kanban](https://github.com/orgs/IES9018/projects/2)

## Consideraciones

- **Arquitectura:** Ver [ADR-001](docs/adr/ADR-001-stack-tecnologico.md) para la justificación del stack.
- **Control de calidad:** ESLint + Prettier configurados. Ejecutar `npx eslint server/` antes de cada PR.
- **Seguridad:** No se debe subir el archivo `.env` al repositorio (está en `.gitignore`).