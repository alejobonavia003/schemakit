# Plantilla multi-solución

Plantilla genérica para construir varias soluciones sobre una misma API:
Express en el backend, Prisma como ORM, PostgreSQL como base de datos y un
frontend React + Vite opcional. Todo el entorno local corre en Docker.

## Requisitos

- Docker con Docker Compose v2.
- Node.js y npm **no** hacen falta en tu máquina para desarrollar. Solo son
  necesarios (Node 18 o superior) si querés ejecutar comandos fuera de Docker.
- Una base PostgreSQL para cualquier entorno desplegado.

## Estructura

```text
├── src/                       # API Express
│   ├── config/                # Variables de entorno y cliente Prisma
│   ├── controllers/           # Lógica de cada recurso
│   ├── middlewares/
│   └── routes/
├── prisma/
│   ├── schema.prisma          # Esquema de datos
│   └── migrations/            # Migraciones versionadas
├── frontend/                  # React + Vite (opcional)
│   └── Dockerfile             # Solo para desarrollo
├── docker/postgres/init/      # Scripts que corren al crear la base por primera vez
├── Dockerfile                 # Imagen del backend
├── docker-compose.yml         # db + backend + frontend
├── .dockerignore
└── .env.example
```

## Inicio rápido

```bash
git clone <URL_DEL_REPOSITORIO>
cd <CARPETA_DEL_REPOSITORIO>
cp .env.example .env
docker compose up --build
```

| Servicio | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend (API) | http://localhost:3000 |
| Health check | http://localhost:3000/api/health |
| PostgreSQL (desde tu máquina) | `localhost:5433` |

En el primer arranque, Docker crea la base, el schema de la solución y las
tablas (aplica las migraciones automáticamente). No hay que ejecutar ningún
comando de Node a mano.

En desarrollo, trabajá siempre en `http://localhost:5173`. El puerto `3000` es
la API (y solo muestra el frontend si existe un build en `frontend/dist`).

## Desarrollo diario

El código de tu máquina está montado dentro de los containers:

- **Backend:** se reinicia solo al guardar un archivo (`node --watch`).
- **Frontend:** Vite actualiza el navegador al instante (HMR).

Comandos útiles:

| Acción | Comando |
| --- | --- |
| Levantar en segundo plano | `docker compose up -d` |
| Ver logs | `docker compose logs -f backend` |
| Abrir una terminal en el backend | `docker compose exec backend sh` |
| Detener los containers | `docker compose down` |
| Reconstruir tras cambiar un `package.json` | `docker compose up --build -V` |
| Resetear todo, incluida la base | `docker compose down -v` |

> `-V` renueva el volumen de `node_modules`. Sin él, una dependencia nueva puede
> no aparecer dentro del container.
>
> ⚠️ `docker compose down -v` **elimina los datos** de la base local.

## Base de datos y migraciones

Al iniciar, el backend ejecuta `prisma generate` y `prisma migrate deploy`, que
aplica solo las migraciones pendientes.

Para crear una migración nueva después de cambiar `prisma/schema.prisma`:

```bash
docker compose exec backend npx prisma migrate dev --name nombre_del_cambio
docker compose restart backend
```

Notas:

- Los cambios en `schema.prisma` y en las migraciones no reinician el backend
  solos: por eso el `restart`.
- En Linux, los archivos que crea el container quedan a nombre de `root`. Si no
  podés editarlos: `sudo chown -R $USER:$USER prisma`.
- No edites ni renombres migraciones ya aplicadas. Si regenerás una migración
  `init`, borrá la anterior; dos migraciones que crean las mismas tablas hacen
  fallar una base limpia.
- `npm run prisma:db:push` sincroniza el esquema sin crear historial. Sirve para
  prototipar, pero no para trabajo que vaya a desplegarse.

Acceso a la base desde tu máquina (por ejemplo, con un cliente SQL o Prisma
Studio): host `localhost`, puerto `5433`, con el usuario, la contraseña y la
base de tu `.env`. Para Prisma Studio (requiere Node local):

```bash
DATABASE_URL="postgresql://app:app_password@localhost:5433/app_db?schema=solution_template" npx prisma studio
```

## Variables de entorno

Se definen en `.env` (copia de `.env.example`, que no se sube a Git).

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `POSTGRES_USER` | Usuario de la base | `app` |
| `POSTGRES_PASSWORD` | Contraseña de la base | `app_password` |
| `POSTGRES_DB` | Nombre de la base | `app_db` |
| `POSTGRES_SCHEMA` | Schema aislado de la solución | `solution_template` |
| `PORT` | Puerto del backend | `3000` |
| `CORS_ORIGINS` | Orígenes permitidos, separados por comas | `http://localhost:5173` |
| `VITE_API_URL` | (Frontend, opcional) URL de la API si está en otro dominio | vacío |

Las variables `POSTGRES_*` solo se aplican cuando el volumen de la base es
nuevo. Si las cambiás con una base ya creada, reseteala con
`docker compose down -v`.

`DATABASE_URL` no hace falta en el `.env` local: `docker-compose.yml` la arma con
las variables anteriores, apuntando al servicio `db` (nunca a `localhost`) y
con `?schema=<POSTGRES_SCHEMA>`. Solo se define a mano en los entornos
desplegados.

`CORS_ORIGINS` acepta varios orígenes separados por comas. En producción debe
incluir únicamente los frontends autorizados.

## Cómo se comunica el frontend con la API

El frontend llama a rutas relativas (`/api/...`):

- **Desarrollo:** el proxy de Vite (`frontend/vite.config.js`) reenvía `/api` al
  backend.
- **Producción integrada:** Express sirve el frontend y la API desde el mismo
  origen, así que no hay que configurar nada.
- **Frontend en otro dominio:** definí `VITE_API_URL` con la URL pública del
  backend **terminada en `/`** (por ejemplo `https://<backend>/`). La barra
  final es obligatoria, porque el frontend le agrega `api/...`.

## Frontend integrado en Express

Para compilar el frontend y servirlo desde el mismo proceso de Express
(requiere Node 18 o superior y una `DATABASE_URL` accesible):

```bash
npm run build
npm start
```

Express sirve `frontend/dist`, mantiene la API bajo `/api` y aplica fallback
de SPA para las rutas del frontend. El frontend también puede desplegarse de
forma independiente (ver Vercel más abajo).

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
6. Aplicar las migraciones con `npm run prisma:migrate:deploy` (el repositorio
   ya tiene migraciones versionadas). `npm run prisma:db:push` queda solo para
   prototipos.

Railway asigna `PORT` automáticamente. El endpoint de comprobación es
`GET /api/health`.

## Desplegar solo el frontend en Vercel

1. Importar el repositorio en Vercel y seleccionar `frontend` como
   **Root Directory**.
2. Mantener `npm run build` como comando de build y `dist` como directorio de
   salida.
3. Crear `VITE_API_URL` con la URL pública del backend terminada en `/`, por
   ejemplo `https://<backend>/`.
4. Agregar esa URL de Vercel a `CORS_ORIGINS` en el backend.

El backend debe estar desplegado y accesible por HTTPS para que el frontend
pueda consultar la API.

## Flujo para una solución nueva

1. Cloná esta plantilla en un repositorio nuevo y elegí un nombre para la
   solución.
2. Copiá `.env.example` a `.env` y cambiá `POSTGRES_SCHEMA` por el nombre del
   schema de la solución; no cambies el `schema.prisma` para separar
   soluciones, porque el aislamiento lo determina el schema de `DATABASE_URL`.
3. Levantá el entorno con `docker compose up --build`.
4. Agregá los modelos propios en `prisma/schema.prisma` y creá una migración con
   `docker compose exec backend npx prisma migrate dev --name nombre_del_cambio`.
5. Agregá cada recurso siguiendo `controller + routes` y registralo en
   `src/routes/index.js`.
6. En Railway configurá un servicio Node nuevo, la `DATABASE_URL` con el schema
   propio y las variables de CORS. No reutilices el schema de otra solución.
7. Elegí frontend embebido o Vercel según la sección correspondiente y probá
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

## Solución de problemas

| Síntoma | Qué hacer |
| --- | --- |
| Puerto `3000`, `5173` o `5433` ocupado | Detené el proceso que lo usa o cambiá el mapeo en `docker-compose.yml` (para el backend, `PORT` en `.env`) |
| Un módulo nuevo aparece como "not found" | `docker compose up --build -V` |
| `P3005` o `relation ... already exists` al migrar | La base tiene tablas sin historial de migraciones o hay migraciones duplicadas: `docker compose down -v` |
| El schema no existe | El script de `docker/postgres/init` solo corre con una base nueva: `docker compose down -v` |
| El hot reload no detecta cambios (Windows/WSL) | Mantené el proyecto dentro del filesystem de WSL (no en `/mnt/c`) |
| No podés editar archivos creados por Docker | `sudo chown -R $USER:$USER .` sobre la carpeta afectada |
