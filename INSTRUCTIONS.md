# INSTRUCTIONS.md — Instrucciones del Agente

## Contexto del Proyecto

Sistema de turnos para peluquería/barbería. Permite a clientes reservar turnos online y a administradores gestionar la agenda.

## Stack

- **Frontend:** React 18+ / Vite / TypeScript / TailwindCSS
- **Backend:** Node.js / Express / TypeScript
- **Base de datos:** PostgreSQL / Prisma ORM
- **Autenticación:** JWT + bcrypt

## Reglas que el agente debe seguir

1. Usar TypeScript estricto en todo el proyecto.
2. No usar nunca el tipo `any`.
3. Los componentes React son funcionales (no clases).
4. Los commits deben seguir el formato convencional: `feat:`, `fix:`, `docs:`, `chore:`.
5. Los archivos del backend van en `server/`, los del frontend en `src/`.
6. Nunca subir `.env` al repositorio.
7. Las respuestas de la API siguen el formato `{ success: boolean, data?: any, error?: string }`.
8. Verificar types con `npx tsc --noEmit` y lint con `npx eslint` antes de cada commit.

## Estructura del proyecto

```
├── src/                # Frontend React
│   ├── components/     # Componentes UI
│   ├── pages/          # Páginas/rutas
│   ├── hooks/          # Custom hooks
│   ├── services/       # Llamadas a la API
│   └── types/          # Interfaces compartidas
├── server/             # Backend Express
│   ├── routes/         # Rutas
│   ├── controllers/    # Controllers
│   ├── services/       # Lógica de negocio
│   ├── middlewares/    # Middlewares
│   └── prisma/         # Schema y migraciones
└── docs/               # Documentación
    ├── adr/            # Decisiones arquitectónicas
    └── auditoria/      # Informes de auditoría
```
