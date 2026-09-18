# Plantilla multi-solución

Plantilla genérica para construir varias soluciones sobre una misma API:
Express en el backend, Prisma como ORM, PostgreSQL como base de datos y un
frontend React + Vite opcional.

## Requisitos

- Node.js 18 o superior y npm
- Docker con Docker Compose para el entorno local
- Una base PostgreSQL para cualquier entorno desplegado

## Estructura

```text
├── src/                 # API Express
│   ├── config/          # Variables de entorno y cliente Prisma
│   ├── controllers/     # Lógica de cada recurso
│   ├── middlewares/
│   └── routes/
├── prisma/schema.prisma # Esquema de datos
├── frontend/            # React + Vite (opcional)
├── docker-compose.yml   # PostgreSQL local
└── .env.example
```

## Clonar y ejecutar en local

```bash
git clone <URL_DEL_REPOSITORIO>
cd <CARPETA_DEL_REPOSITORIO>
cp .env.example .env #o touch
npm install
npm --prefix frontend install
docker compose up -d db
docker compose exec db psql -U app -d app_db -c "CREATE SCHEMA IF NOT EXISTS solution_template;" #por defecto usa public (ver variables de entorno)
npm run prisma:generate
npm run prisma:db:push
npm run dev
```

La API queda disponible en `http://localhost:3000`. En otra terminal, el
frontend de desarrollo se inicia con:

```bash
npm --prefix frontend run dev
```

Luego se puede abrir `http://localhost:5173`. Para crear migraciones
versionadas en lugar de sincronizar directamente el esquema:

```bash
npx prisma migrate dev --name init
```


## Variables de entorno y URL del esquema

El archivo `.env.example` contiene una URL local compatible con el servicio de
Docker:

```env
DATABASE_URL="postgresql://app:app_password@localhost:5432/app_db?schema=solution_template"
CORS_ORIGINS="http://localhost:5173"
```

`DATABASE_URL` debe apuntar a la base PostgreSQL que se usará. El parámetro
`schema=solution_template` indica el esquema aislado de esta solución. Creá ese
schema una sola vez antes de ejecutar Prisma:

```sql
CREATE SCHEMA IF NOT EXISTS solution_template;
```

`CORS_ORIGINS` acepta varios orígenes separados por comas. En producción debe
incluir únicamente los frontends autorizados.

## Frontend integrado en Express

Para compilar el frontend y servirlo desde el mismo proceso de Express:

```bash
npm run build
npm start
```

Express sirve `frontend/dist`, mantiene la API bajo `/api` y aplica fallback
de SPA para las rutas del frontend. Para que el build use el mismo origen,
se puede crear `frontend/.env` con:

```env
VITE_API_URL=/api
```

El frontend también puede desplegarse de forma independiente; en ese caso
`VITE_API_URL` debe ser la URL pública de la API terminada en `/api`.

## Desplegar el backend en Railway

1. Crear un proyecto con un servicio PostgreSQL y un servicio para este
   repositorio. Cada solución nueva debe ser un servicio Node independiente.
2. Elegir un nombre único para el schema, por ejemplo `cliente_a`, y crear ese
   schema en la base compartida desde la consola SQL de Railway:
   `CREATE SCHEMA cliente_a;`.
3. Configurar en el servicio de la aplicación `DATABASE_URL` usando la
   referencia de la base de Railway y agregando `?schema=cliente_a`.
4. Definir `CORS_ORIGINS` con la URL del frontend, además de `NODE_ENV=production`.
5. Usar `npm run build` como comando de build y `npm start` como comando de
   inicio.
6. Ejecutar `npm run prisma:db:push` una vez desde el servicio (o usar
   `npm run prisma:migrate:deploy` cuando el repositorio tenga migraciones
   versionadas).

Railway asigna `PORT` automáticamente. El endpoint de comprobación es
`GET /api/health`.

## Desplegar solo el frontend en Vercel

1. Importar el repositorio en Vercel y seleccionar `frontend` como
   **Root Directory**.
2. Mantener `npm run build` como comando de build y `dist` como directorio de
   salida.
3. Crear `VITE_API_URL` con la URL pública del backend, por ejemplo
   `https://<backend>/api`.
4. Agregar esa URL de Vercel a `CORS_ORIGINS` en el backend.

El backend debe estar desplegado y accesible por HTTPS para que el frontend
pueda consultar la API.

## Flujo para una solución nueva

1. Cloná esta plantilla en un repositorio nuevo y elegí un nombre para la
   solución.
2. Copiá `.env.example` a `.env` y cambiá el nombre del schema; no cambies el
   `schema.prisma` para separar soluciones, porque el aislamiento lo determina
   `DATABASE_URL`.
3. Agregá los modelos propios en `prisma/schema.prisma` y creá una migración con
   `npm run prisma:migrate -- --name nombre_del_cambio`.
4. Agregá cada recurso siguiendo `controller + routes` y registralo en
   `src/routes/index.js`.
5. En Railway configurá un servicio Node nuevo, la `DATABASE_URL` con el schema
   propio y las variables de CORS. No reutilices el schema de otra solución.
6. Elegí frontend embebido o Vercel según la sección correspondiente y probá
   `GET /api/health`.

## API de ejemplo

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Comprueba que la API está activa |
| GET | `/api/examples` | Lista los registros de ejemplo |
| GET | `/api/examples/:id` | Obtiene un registro por ID |
| POST | `/api/examples` | Crea un registro con `{ "name": "..." }` |

El recurso `Example` es deliberadamente pequeño: sirve como punto de partida
para agregar cada solución con su modelo Prisma, controlador y rutas propias.
