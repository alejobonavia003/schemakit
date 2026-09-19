# Versión de Node: ajustala a la que usa tu proyecto (node -v)
ARG NODE_VERSION=22

# ---------- base: lo común a todos los stages ----------
FROM node:${NODE_VERSION}-slim AS base

# openssl es necesario para Prisma (por eso slim y no alpine)
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---------- development: lo que usamos en docker compose ----------
FROM base AS development

ENV NODE_ENV=development
# Puerto por defecto; compose o Railway pueden pisarlo con su propio PORT
ENV PORT=3000

# Primero solo lo necesario para instalar (aprovecha la caché de Docker)
COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci

# Después el resto del código
COPY . .

# Genera Prisma Client dentro de la imagen.
# generate no se conecta a la base, pero prisma.config.ts exige que DATABASE_URL exista,
# así que le pasamos un valor de relleno solo para este comando (no queda en la imagen).
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ---------- production: se completa en la Fase 14 (Railway) ----------
