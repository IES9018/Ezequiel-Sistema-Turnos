# Guía de Despliegue — Sistema de Turnos

**Sprint 3 / Fase 4** · Fecha: 2026-11-03 · Autor: estudiante (1 dev)

## Qué se despliega

Un **único proceso Node** (Express) sirve:

- la **API REST** bajo `/api` (contrato OpenAPI `docs/arquitectura/api-contracts.yaml`), y
- la **SPA** compilada (`client/dist`) como estáticos, con *fallback* a `index.html` para las rutas del cliente.

La base de datos es **PostgreSQL 16**. El proceso aplica **CSP y cabeceras de seguridad** a todas las respuestas (`server/middlewares/security-headers.ts`) y **compresión gzip** + caché inmutable para los assets con hash.

```
Navegador ──HTTPS──> Express (Node 22)
                        ├── /api/*  ──> PostgreSQL 16 (Prisma)
                        └── /*      ──> client/dist (SPA)
```

> **Nota de entorno:** la máquina de desarrollo **no tiene Docker instalado**, por lo que el despliegue se **verificó con el equivalente local** (Opción B, sección "Verificación") y se entrega además el **artefacto Docker reproducible** (Opción A: `Dockerfile` + `docker-compose.yml`).

## Variables de entorno

| Variable | Obligatoria | Ejemplo / valor | Descripción |
|---|---|---|---|
| `DATABASE_URL` | sí | `postgresql://turnos:turnos@db:5432/turnos_db?schema=public` | Cadena de conexión de Prisma/PostgreSQL. |
| `JWT_SECRET` | **sí** | *(cadena larga aleatoria)* | Secreto de firma JWT. `getJwtSecret()` **lanza error** si falta (sin fallback). |
| `PORT` | no | `3001` | Puerto HTTP del proceso. |
| `NODE_ENV` | no | `production` | En `production` sirve la SPA desde `client/dist`. |

Generar un secreto: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

## Opción A — Docker Compose (artefacto reproducible)

Requisitos: Docker + Docker Compose.

```bash
# 1) Definir el secreto (no commitear)
export JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"

# 2) Construir y levantar app + PostgreSQL
docker compose up --build -d

# 3) Aplicar esquema y datos demo (el contenedor ya hace db push al arrancar)
docker compose exec app npm run db:seed

# 4) Verificar
curl -s http://localhost:3001/api/health
# {"success":true,"data":{"status":"ok","timestamp":"..."}}
```

La app queda en **http://localhost:3001**. PostgreSQL se publica en `localhost:5433` para no chocar con una instancia local en 5432.

Qué hace la imagen (`Dockerfile`, multi-stage):

1. **build**: `npm ci` + `prisma generate` + `tsc` (backend) y `npm ci` + `vite build` (frontend).
2. **runtime** (`node:22-alpine`): instala deps, regenera Prisma Client, copia `dist/` y `client/dist/`, y al arrancar corre `prisma db push` y `node dist/index.js`.

## Opción B — Local (verificada en este entorno)

Requisitos: Node 22, PostgreSQL 16 en `localhost:5432` con la base `turnos_db` creada.

```bash
# 1) Dependencias
npm ci
npm --prefix client ci

# 2) Cliente Prisma + esquema + datos demo
npx prisma generate
npx prisma db push
npm run db:seed

# 3) Compilar backend y frontend
npm run build
npm --prefix client run build

# 4) Arrancar en modo producción (sirve API + SPA)
NODE_ENV=production PORT=3001 JWT_SECRET="<secreto>" node dist/index.js
```

Con `.env` presente, `dotenv` toma `DATABASE_URL`/`JWT_SECRET` automáticamente; en ese caso basta `NODE_ENV=production node dist/index.js`.

### Verificación (smoke tests) — ejecutada

```bash
# Salud
curl -s http://localhost:3001/api/health
# -> {"success":true,"data":{"status":"ok",...}}

# Cabeceras de seguridad + CSP en la SPA
curl -sI http://localhost:3001/ | grep -iE "content-security|x-content|x-frame|referrer|permissions"

# Login (credenciales demo del seed)
curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@turnos.test","password":"admin1234"}'
# -> {"success":true,"data":{"token":"...","usuario":{...,"rol":"ADMIN"}}}

# Assets comprimidos y cacheables
curl -sI -H 'Accept-Encoding: gzip' http://localhost:3001/assets/<index>.js \
  | grep -iE "content-encoding|cache-control"
# -> Content-Encoding: gzip / Cache-Control: public, max-age=31536000, immutable
```

### Credenciales demo (seed)

| Rol | Email | Password |
|---|---|---|
| ADMIN | `admin@turnos.test` | `admin1234` |
| CLIENTE | `cliente@turnos.test` | `cliente1234` |

> Solo para demo. En producción se cambian y **no** se versiona `.env`.

## Seguridad del despliegue

- **CSP** restrictiva (`default-src 'self'`, `script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, etc.) — mitiga T-08 (robo de JWT por XSS).
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Permissions-Policy` sin cámara/micrófono/geolocalización.
- `JWT_SECRET` obligatorio desde entorno; `bcrypt` para passwords; rate-limit por IP; `AuditLog` en cambios de estado; body-limit 100 KB (ver threat model).
- Para producción real: terminar TLS en un reverse proxy (HTTPS) y agregar `Strict-Transport-Security`; hoy la app se sirve por HTTP local.

## Presupuestos de rendimiento medidos (evidencia)

Perfil: mobile, 360×800. LCP/FCP/TBT con **Lighthouse 12** (throttling simulado); en pantallas autenticadas la sesión se inyecta con Puppeteer (`localStorage`) y se navega directo a `/`, sin página-puente. INP con **CDP/Event Timing** (CPU 4× + red 4G lenta) sobre la interacción primaria. Salidas crudas en `docs/deploy/evidencia/` (ver `README.md` de esa carpeta).

| Pantalla | LCP | Objetivo | INP (click primario) | Objetivo | Peso JS |
|---|---|---|---|---|---|
| Login (entrada) | **1.72 s** | < 2.5 s ✅ | — | — | — |
| Reserva de turno | **1.91 s** (máx 2.46 s) | < 2.5 s ✅ | **160 ms** | < 200 ms ✅ | **61.1 KB gzip** ✅ (< 200) |
| Agenda admin | **1.61 s** (máx 1.75 s) | < 2.5 s ✅ | **32 ms** | < 200 ms ✅ | (bundle compartido) |

Evidencia: [`evidencia/lighthouse-login.txt`](evidencia/lighthouse-login.txt), [`evidencia/lighthouse-reserva.txt`](evidencia/lighthouse-reserva.txt), [`evidencia/lighthouse-agenda-admin.txt`](evidencia/lighthouse-agenda-admin.txt), [`evidencia/cdp-reserva.txt`](evidencia/cdp-reserva.txt), [`evidencia/cdp-agenda-admin.txt`](evidencia/cdp-agenda-admin.txt), [`evidencia/budget-js.txt`](evidencia/budget-js.txt).

Corrección metodológica: la primera medición de las pantallas autenticadas usaba una página-puente con redirección, que sumaba una navegación al LCP (agenda admin: 2.59 s). Al inyectar la sesión y navegar directo, el valor real es **1.61 s**: no había brecha de código, sino de medición. Se evaluó *code-splitting* con `React.lazy`: no mejoró el LCP y subió el JS de 61.1 a 63.5 KB gzip, por lo que se descartó (React DOM domina el bundle).

## Qué haría distinto (retrospectiva)

1. **Migraciones versionadas** (`prisma migrate deploy`) en lugar de `db push` en el arranque del contenedor: `db push` es cómodo para demo pero no auditable ni seguro ante cambios destructivos.
2. **PostgreSQL gestionado** (Neon/Supabase/RDS) y secretos en el gestor de la plataforma, no en variables del compose.
3. **CI/CD**: el pipeline ya corre tests, presupuestos y `Lighthouse CI`; falta construir/publicar la imagen y usar `prisma migrate deploy` en el arranque.
4. **HTTPS + HSTS** desde el día uno (hoy la verificación fue HTTP local).
5. **Observabilidad**: logs estructurados y *healthcheck* de la dependencia DB en la app (hoy el health solo reporta el proceso).
6. **Imagen más chica**: separar deps de producción y copiar el Prisma Client generado desde la etapa de build, en vez de instalar devDependencies en runtime.
