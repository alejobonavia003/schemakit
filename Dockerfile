# Versión de Node: ajustala a la que usa tu proyecto (node -v)
ARG NODE_VERSION=22

# ---------- base: lo común a todos los stages ----------
FROM node:${NODE_VERSION}-slim AS base

# openssl es necesario para Prisma (por eso slim y no alpine)
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---------- development: lo que usa docker compose ----------
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

# ---------- build: compila el frontend (este stage no llega a la imagen final) ----------
FROM base AS build

ENV NODE_ENV=development

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm --prefix frontend ci

COPY . .

# Genera Prisma Client y compila el frontend en frontend/dist
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate \
    && npm --prefix frontend run build

# ---------- production: DEBE ser el último stage ----------
# Railway (y "docker build" sin --target) construyen el último stage.
# docker-compose usa target: development, así que no se ve afectado.
FROM base AS production

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/frontend/dist ./frontend/dist
COPY package.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

EXPOSE 3000

# Aplica las migraciones pendientes y arranca. Railway define PORT automáticamente.
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
