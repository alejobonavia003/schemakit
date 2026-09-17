# Ladies API

Proyecto base para una API REST con Node.js + Express y frontend React + Vite. El backend usa PostgreSQL como base de datos y Prisma como ORM, con un flujo local de desarrollo preparado para migrar sin cambios a producción.

## Stack actual

- Backend: Node.js + Express
- Base de datos: PostgreSQL 16
- ORM: Prisma
- Frontend: React + Vite
- Contenerización local: Docker Compose

## Requisitos

- Node.js 18 o superior
- npm
- Docker + Docker Compose

## Estructura general

```text
ladies/
├── src/                 # Backend Express
├── frontend/            # Frontend React + Vite
├── prisma/              # Schema y migraciones de Prisma
├── docker-compose.yml    # PostgreSQL local
├── .env.example         # Variables de entorno de ejemplo
├── .gitignore
├── package.json
├── DOCUMENTACION_TECNICA.md
└── README.md
```

## 1. Preparación local

1. Instalar dependencias del backend:

```bash
npm install
```

2. Instalar dependencias del frontend:

```bash
cd frontend
npm install
cd ..
```

3. Crear el archivo `.env` a partir del ejemplo:

```bash
#o usar touch en linux
cp .env.example .env
```

El archivo `.env` debe quedar con una `DATABASE_URL` apuntando a PostgreSQL local, por ejemplo:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://ladies:ladies_dev@localhost:5432/ladies?schema=public"
```

## 2. Levantar PostgreSQL con Docker

Desde la raíz del proyecto:

```bash
docker compose up -d
```

Esto levanta un contenedor PostgreSQL con los datos definidos en `docker-compose.yml`.

## 3. Preparar la base con Prisma

Si la base está recién creada o si se quiere reinitializar el esquema:

```bash
npx prisma migrate dev --name init
```

O, si no hay migraciones aún:

```bash
npx prisma generate
```

## 4. Ejecutar la aplicación en local

Backend:

```bash
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

El backend normalmente corre en:

```text
http://localhost:3000
```

Y el frontend en:

```text
http://localhost:5173
```

## 5. Endpoints principales

- `GET /api/health` → chequeo del backend
- `GET /api/examples` → lista ejemplos
- `GET /api/examples/:id` → trae un ejemplo por ID
- `POST /api/examples` → crea un ejemplo

## 6. Convenciones para trabajar en equipo

- El archivo `.env` nunca se sube al repositorio.
- La base de datos local se levanta con Docker.
- Las migraciones se versionan dentro de `prisma/migrations/`.
- Cada recurso nuevo sigue el patrón: controlador + ruta + modelo Prisma si aplica.

## 7. Estado de despliegue

La integración con Railway y Vercel todavía no está implementada. Este repo queda preparado para esa etapa, pero la configuración de producción y la variable `VITE_API_URL` se completarán en el momento en que se despliegue el backend y el frontend en esos proveedores.

## 8. Flujo recomendado para un desarrollador nuevo

```bash
git clone <repo>
cd ladies
npm install
cd frontend && npm install && cd ..
cp .env.example .env

docker compose up -d
npx prisma migrate dev --name init
npm run dev
```

En otra terminal:

```bash
cd frontend
npm run dev
```
