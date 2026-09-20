<div align="center">

# 🧩 schemakit

**Starter full-stack para lanzar varias soluciones sobre una misma base PostgreSQL, cada una aislada en su propio schema.**

Express · Prisma · PostgreSQL · React + Vite · Docker · Railway

[![CI](https://github.com/alejobonavia003/schemakit/actions/workflows/ci.yml/badge.svg)](https://github.com/alejobonavia003/schemakit/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/Node-22-339933?logo=node.js&logoColor=white)
[![License](https://img.shields.io/github/license/alejobonavia003/schemakit)](LICENSE)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway&logoColor=white)


[Inicio rápido](#inicio-rápido) ·
[Arquitectura](#arquitectura) ·
[Despliegue](#despliegue) ·
[Usar como plantilla](#usar-como-plantilla) ·
[Solución de problemas](#solución-de-problemas)

</div>

<!--
  Sumá una captura o un GIF de la app acá. Guardalo en docs/ y descomentá:
  ![Captura de la aplicación](docs/screenshot.png)
-->

## ¿Por qué existe?

Cada proyecto nuevo suele empezar con los mismos pasos: armar el backend, conectar
la base, montar el frontend, configurar Docker y preparar el despliegue.
**schemakit** deja todo eso resuelto y agrega una idea: en vez de crear una base
de datos por solución, cada solución usa **su propio schema** dentro de una base
PostgreSQL compartida. Es barato de mantener y mantiene los datos aislados.

## Características

- 🐳 **Todo con un comando.** `docker compose up --build` levanta base, API y frontend, sin instalar Node.
- 🔥 **Hot reload real** en backend (`node --watch`) y frontend (Vite HMR).
- 🗄️ **Un schema por solución.** El aislamiento lo define una sola variable: `POSTGRES_SCHEMA`.
- 🔁 **Migraciones automáticas.** Al iniciar se ejecutan `prisma generate` y `prisma migrate deploy`.
- 📦 **Un solo servicio en producción.** Express sirve la API y el frontend compilado.
- 🔌 **Mismo comportamiento en desarrollo y producción.** El frontend llama a `/api` y el proxy de Vite hace el resto (sin problemas de CORS).
- 🚂 **Listo para Railway.** Dockerfile multi-stage que compila el frontend y aplica las migraciones al arrancar.
- ✅ **CI con GitHub Actions.** Construye la imagen de producción y prueba el stack completo.

## Stack

| Capa | Tecnología |
| --- | --- |
| API | Express 4 |
| ORM y migraciones | Prisma 6 |
| Base de datos | PostgreSQL 16 |
| Frontend | React + Vite |
| Contenedores | Docker y Docker Compose |
| Despliegue | Railway (backend + frontend integrado), Vercel (frontend opcional) |

## Arquitectura

**Desarrollo** (`docker compose up`):

```mermaid
flowchart LR
    B["Navegador"] -->|":5173"| V["Vite dev server (HMR)"]
    V -->|"proxy /api"| A["Express API (node --watch)"]
    A --> P[("PostgreSQL 16<br/>schema: solution_template")]
```

**Producción** (una sola imagen, un solo servicio):

```mermaid
flowchart LR
    U["Usuario"] --> R["Express en Railway<br/>API + frontend/dist"]
    R --> D[("PostgreSQL compartido")]
    D --- S1["schema cliente_a"]
    D --- S2["schema cliente_b"]
    D --- S3["schema cliente_c"]
```

## Inicio rápido

Requisitos: **Docker con Docker Compose v2**. No hace falta Node.js ni npm en tu
máquina.

```bash
git clone https://github.com/alejobonavia003/schemakit.git
cd schemakit
cp .env.example .env
docker compose up --build
```

| Servicio | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend (API) | http://localhost:3000 |
| Health check | http://localhost:3000/api/health |
| PostgreSQL (desde tu máquina) | `localhost:5433` |

En el primer arranque, Docker crea la base, el schema de la solución y las tablas
(aplica las migraciones automáticamente). No hay que ejecutar ningún comando de
Node a mano.

En desarrollo, trabajá siempre en `http://localhost:5173`. El puerto `3000` es la
API (y solo muestra el frontend si existe un build en `frontend/dist`).

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
├── frontend/                  # React + Vite
│   └── Dockerfile             # Solo para desarrollo
├── docker/postgres/init/      # Scripts que corren al crear la base por primera vez
├── .github/                   # CI y Dependabot
├── Dockerfile                 # Multi-stage: development y production
├── docker-compose.yml         # db + backend + frontend
└── .env.example
```

## Desarrollo diario

El código de tu máquina está montado dentro de los containers:

- **Backend:** se reinicia solo al guardar un archivo.
- **Frontend:** Vite actualiza el navegador al instante.

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

Acceso a la base desde tu máquina (cliente SQL, Prisma Studio): host `localhost`,
puerto `5433`, con el usuario, la contraseña y la base de tu `.env`. Para Prisma
Studio (requiere Node local):

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

Las variables `POSTGRES_*` solo se aplican cuando el volumen de la base es nuevo.
Si las cambiás con una base ya creada, reseteala con `docker compose down -v`.

`DATABASE_URL` no hace falta en el `.env` local: `docker-compose.yml` la arma con
las variables anteriores, apuntando al servicio `db` (nunca a `localhost`) y con
`?schema=<POSTGRES_SCHEMA>`. Solo se define a mano en los entornos desplegados.

`CORS_ORIGINS` acepta varios orígenes separados por comas. En producción debe
incluir únicamente los frontends autorizados.

## Cómo se comunica el frontend con la API

El frontend llama a rutas relativas (`/api/...`):

- **Desarrollo:** el proxy de Vite (`frontend/vite.config.js`) reenvía `/api` al
  backend.
- **Producción integrada:** Express sirve el frontend y la API desde el mismo
  origen, así que no hay que configurar nada.
- **Frontend en otro dominio:** definí `VITE_API_URL` con la URL pública del
  backend **terminada en `/`** (por ejemplo `https://<backend>/`). La barra final
  es obligatoria, porque el frontend le agrega `api/...`.

## API de ejemplo

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Comprueba que la API está activa |
| GET | `/api/examples` | Lista los registros de ejemplo |
| GET | `/api/examples/:id` | Obtiene un registro por ID |
| POST | `/api/examples` | Crea un registro con `{ "name": "..." }` |

El recurso `Example` es deliberadamente pequeño: sirve como punto de partida para
agregar cada solución con su modelo Prisma, controlador y rutas propias.

## Despliegue

### Backend con frontend integrado en Railway 

El `Dockerfile` tiene un stage `production` (el último) que compila el frontend y
deja una imagen con Express sirviendo la API y `frontend/dist`. Railway detecta el
`Dockerfile` y construye ese stage automáticamente. Al iniciar, el container
aplica las migraciones con `prisma migrate deploy`.

1. Crear un proyecto con un servicio PostgreSQL y un servicio para este
   repositorio. Cada solución nueva debe ser un servicio independiente.
2. Elegir un nombre único para el schema, por ejemplo `cliente_a`, y crearlo en la
   base compartida desde la consola SQL de Railway: `CREATE SCHEMA cliente_a;`.
3. Configurar las variables del servicio:

   | Variable | Valor |
   | --- | --- |
   | `DATABASE_URL` | Referencia a la base de Railway más `?schema=cliente_a` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGINS` | URL pública del servicio (o de los frontends autorizados) |

4. **No** definir Build Command ni Start Command: los resuelve el `Dockerfile`.
   Tampoco definas `PORT`, Railway lo asigna solo.
5. (Opcional) En Settings → Healthcheck Path, usar `/api/health`.

### Solo el frontend en Vercel

1. Importar el repositorio en Vercel y seleccionar `frontend` como **Root Directory**.
2. Mantener `npm run build` como comando de build y `dist` como directorio de salida.
3. Crear `VITE_API_URL` con la URL pública del backend terminada en `/`, por ejemplo
   `https://<backend>/`.
4. Agregar esa URL de Vercel a `CORS_ORIGINS` en el backend.

El backend debe estar desplegado y accesible por HTTPS para que el frontend pueda
consultar la API.

## Usar como plantilla

1. Hacé clic en **Use this template** en GitHub (o cloná el repositorio) y creá
   uno nuevo para tu solución.
2. Copiá `.env.example` a `.env` y cambiá `POSTGRES_SCHEMA` por el nombre del
   schema de la solución. No cambies el `schema.prisma` para separar soluciones:
   el aislamiento lo determina el schema de `DATABASE_URL`.
3. Levantá el entorno con `docker compose up --build`.
4. Agregá los modelos propios en `prisma/schema.prisma` y creá una migración con
   `docker compose exec backend npx prisma migrate dev --name nombre_del_cambio`.
5. Agregá cada recurso siguiendo `controller + routes` y registralo en
   `src/routes/index.js`.
6. En Railway configurá un servicio nuevo, con la `DATABASE_URL` de su propio
   schema y las variables de CORS. No reutilices el schema de otra solución.
7. Probá `GET /api/health` en el dominio desplegado.

## Solución de problemas

| Síntoma | Qué hacer |
| --- | --- |
| Puerto `3000`, `5173` o `5433` ocupado | Detené el proceso que lo usa o cambiá el mapeo en `docker-compose.yml` (para el backend, `PORT` en `.env`) |
| Un módulo nuevo aparece como "not found" | `docker compose up --build -V` |
| `P3005` o `relation ... already exists` al migrar | La base tiene tablas sin historial de migraciones o hay migraciones duplicadas: `docker compose down -v` |
| El schema no existe | El script de `docker/postgres/init` solo corre con una base nueva: `docker compose down -v` |
| El hot reload no detecta cambios (Windows/WSL) | Mantené el proyecto dentro del filesystem de WSL (no en `/mnt/c`) |
| No podés editar archivos creados por Docker | `sudo chown -R $USER:$USER .` sobre la carpeta afectada |
| Railway muestra `frontend/dist/index.html` inexistente | Verificá que el builder sea el `Dockerfile` y que no haya Start Command personalizado |

## Roadmap

- [ ] Documentación de la API con OpenAPI / Swagger
- [ ] Tests de la API con Vitest y Supertest
- [ ] Script de seed con datos de ejemplo
- [ ] Seguridad básica: `helmet` y límite de peticiones
- [ ] Lint y formato (ESLint y Prettier)

Ver el [roadmap completo](https://github.com/alejobonavia003/schemakit/issues/18)]

## Contribuir

Las contribuciones son bienvenidas:

1. Hacé un fork y creá una rama (`feat/mi-cambio`).
2. Usá mensajes de commit descriptivos (por ejemplo `feat:`, `fix:`, `docs:`).
3. Comprobá que `docker compose up --build` funciona desde cero.
4. Abrí un Pull Request. La CI tiene que pasar.


## Licencia

Distribuido bajo la licencia [MIT](LICENSE).