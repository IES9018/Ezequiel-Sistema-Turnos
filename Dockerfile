# syntax=docker/dockerfile:1

# --- Etapa 1: compilar backend (tsc) y frontend (vite) ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY server ./server
RUN npm run build

WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client ./
RUN npm run build

# --- Etapa 2: runtime mínimo con artefactos compilados ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=build /app/dist ./dist
COPY --from=build /app/client/dist ./client/dist

EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
