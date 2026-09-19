# Guía de implementación: entorno de desarrollo con Docker

Objetivo: pasar de "6 comandos + 2 terminales" a:

```bash
cp .env.example .env
docker compose up --build
```

Regla de oro: hacelo por fases y no avances a la siguiente hasta que la actual funcione. Marcá cada bloque cuando esté listo.

---

## Fase 0 — Decisiones previas y punto de retorno

### 0.1 Decisiones (anotalas antes de empezar)

- [ ] Sistema operativo: `______` (Windows/WSL, macOS, Linux). Si el proyecto está en `/mnt/c/...` (Windows), el hot reload va a necesitar polling.
- [ ] Versión de Node del proyecto: `______`
- [ ] Estrategia de Prisma:
  - `db push`: rápido, sin historial. Sirve para prototipar.
  - `migrate dev` (local) + `migrate deploy` (producción): con historial. Recomendado si vas a llegar a Railway.
  - Decisión: `______`
- [ ] Puerto de PostgreSQL en el host: `5433:5432` (evita choque con un Postgres local y permite usar Prisma Studio desde tu máquina).

### 0.2 Guardar el estado actual

- [ ] Crear una rama:
```bash
  git checkout -b feat/docker-dev-environment
```
- [ ] Comprobar que backend y frontend funcionan sin Docker.
- [ ] Comprobar que `/api/health` responde.
- [ ] Guardar una copia del `docker-compose.yml` actual.
- [ ] Verificar que `.env` ya está en `.gitignore` (antes del primer commit, no al final).

---

## Fase 1 — Backend: Dockerfile

### 1.1 Crear `.dockerignore` (en la raíz)

Va primero, porque si hacés `COPY . .` sin él te copiás `node_modules` del host y el `.env` dentro de la imagen.

- [ ] Ignorar como mínimo: `node_modules`, `.env`, `.git`, `dist`, `frontend/node_modules`.

### 1.2 Crear `Dockerfile` (en la raíz)

- [ ] Imagen base `node:XX-slim` (no `alpine`; Prisma suele dar problemas ahí).
- [ ] Instalar `openssl` en la imagen (`apt-get install -y openssl`), que Prisma necesita.
- [ ] `WORKDIR /app`.
- [ ] Copiar `package.json`, `package-lock.json` y la carpeta `prisma/` antes de instalar dependencias (por si hay un `postinstall` que genera el cliente).
- [ ] Instalar dependencias.
- [ ] Copiar el resto del código.
- [ ] Estructurarlo en stages (`development` ahora, `production` en la Fase 14).
- [ ] Comando del stage `development`: el script `dev` (nodemon o equivalente).
- [ ] El backend debe leer `process.env.PORT` (con fallback a 3000), así Railway no obliga a tocar código después.

### 1.3 Verificar la imagen

- [ ] Construir:
```bash
  docker build --target development -t solution-backend .
```
- [ ] Confirmar que la imagen se construye sin errores.
- [ ] No continuar hasta que esto funcione.

---

## Fase 2 — PostgreSQL

Tu PostgreSQL ya corre en Docker; acá lo mejoramos.

### 2.1 Estructura de inicialización

```
docker/
└── postgres/
    └── init/
        └── 01-init.sql
```

- [ ] Crear `01-init.sql` con:
```sql
  CREATE SCHEMA IF NOT EXISTS solution_template;
```
- [ ] Montar `./docker/postgres/init` en `/docker-entrypoint-initdb.d`.

### 2.2 Volumen y healthcheck

- [ ] Configurar un volumen con nombre para los datos de PostgreSQL.
- [ ] Mapear el puerto como `5433:5432`.
- [ ] Agregar un healthcheck con `pg_isready`:
```yaml
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
    interval: 5s
    timeout: 5s
    retries: 10
```

### 2.3 Verificar persistencia

Todavía no hay tablas (Prisma llega en la Fase 9), así que probá con una tabla manual:

- [ ] Levantar solo la base: `docker compose up -d db`
- [ ] Entrar con psql:
```bash
  docker compose exec db psql -U <usuario> -d <base>
```
- [ ] Crear y llenar una tabla de prueba:
```sql
  CREATE TABLE solution_template.test (id serial PRIMARY KEY, name text);
  INSERT INTO solution_template.test (name) VALUES ('hola');
```
- [ ] Ejecutar `docker compose down`.
- [ ] Volver a ejecutar `docker compose up -d db`.
- [ ] Comprobar que el dato sigue existiendo.
- [ ] Borrar la tabla de prueba (`DROP TABLE solution_template.test;`).

> Los scripts de `docker-entrypoint-initdb.d` **solo se ejecutan cuando el volumen es nuevo**. Si ya tenés un volumen existente, para probar el init tenés que borrarlo:
>
> ```bash
> docker compose down -v
> ```
>
> ⚠️ Esto **elimina los datos** de PostgreSQL. Usalo solo cuando estés seguro de que no los necesitás.

---

## Fase 3 — Variables de entorno y servicio backend en Compose

### 3.1 Variables de entorno

- [ ] Crear `.env.example` (sí va a Git) con todas las variables y valores de ejemplo.
- [ ] Crear `.env` copiándolo (no va a Git).
- [ ] Confirmar con `git status` que `.env` no aparece como archivo a agregar.
- [ ] Definir `DATABASE_URL` apuntando al **servicio**, no a localhost, e incluyendo el schema:
```
  DATABASE_URL=postgresql://USER:PASSWORD@db:5432/DBNAME?schema=solution_template
```
  Dentro de Docker es `db:5432`, nunca `localhost:5432`.

### 3.2 Servicio backend

- [ ] Agregar `backend:` al `docker-compose.yml`.
- [ ] `build` con `target: development`.
- [ ] Configurar `ports` (`3000:3000`).
- [ ] Configurar `env_file` / `environment`.
- [ ] `depends_on` con `condition: service_healthy` sobre `db`.

Conexión esperada:

```
backend ──► db:5432
```

- [ ] Levantar y comprobar que `http://localhost:3000/api/health` responde.

---

## Fase 4 — Volúmenes del backend

Hacemos que el container use tu código local.

```
Tu PC ./            Container
   │                    │
   └────────────────►  /app
                        └── /app/node_modules  (volumen propio, NO el del host)
```

- [ ] Montar el proyecto completo (`./:/app`), o al menos `src/` **y** `prisma/`. Si montás solo `src`, los cambios en `prisma/schema.prisma` no se sincronizan.
- [ ] Agregar un volumen anónimo o con nombre para `/app/node_modules`, así el del host no lo pisa.
- [ ] Si estás en Windows/WSL con el proyecto en `/mnt/c/...`: configurar polling (`nodemon -L` o `legacyWatch`).

> Cuando cambies `package.json`, el volumen de `node_modules` queda viejo. Solución:
> ```bash
> docker compose up --build -V
> ```
> (`-V` renueva los volúmenes anónimos), o bien `docker compose down -v`.

---

## Fase 5 — Backend con hot reload

- [ ] Confirmar que el script `dev` usa nodemon o equivalente.
- [ ] Ejecutar `docker compose up`.
- [ ] Modificar un controller.
- [ ] Comprobar que Express se reinicia solo (mirá los logs).
- [ ] Hacer una petición a la API y confirmar el cambio.

Cuando funcione: **backend Dockerizado ✅**

---

## Fase 6 — Dockerizar el frontend

Crear `frontend/Dockerfile` y `frontend/.dockerignore`.

- [ ] Imagen base `node:XX-slim`.
- [ ] Copiar `package*.json` e instalar dependencias.
- [ ] Copiar el código.
- [ ] Configurar Vite para escuchar en todas las interfaces (`server.host: true` o `--host 0.0.0.0`).
- [ ] Si estás en Windows/WSL: `server.watch.usePolling: true`.
- [ ] `EXPOSE 5173`.
- [ ] Comando: `npm run dev`.

---

## Fase 7 — Agregar el frontend al Compose

- [ ] Agregar el servicio `frontend:`.
- [ ] Configurar `build` (context `./frontend`).
- [ ] Puerto `5173:5173`.
- [ ] Volumen del código del frontend.
- [ ] Volumen propio para `/app/node_modules`.
- [ ] Configurar `VITE_API_URL`:
  - Si el navegador llama directo a la API: `http://localhost:3000` (**no** `http://backend:3000`, porque la llamada sale de tu navegador, no del container).
  - Si usás el proxy de Vite: el target del proxy sí va con `http://backend:3000`.
- [ ] Revisar el CORS del backend: debe permitir el origen `http://localhost:5173`.
- [ ] `depends_on` del backend si corresponde.

---

## Fase 8 — Frontend con hot reload

- [ ] Ejecutar `docker compose up`.
- [ ] Abrir `http://localhost:5173`.
- [ ] Modificar un componente React.
- [ ] Comprobar que Vite actualiza automáticamente, sin comandos adicionales.
- [ ] Comprobar que el frontend puede llamar a la API (mirá la consola del navegador por errores de CORS).

Cuando funcione: **frontend Dockerizado ✅**

---

## Fase 9 — Automatizar Prisma

Objetivo: sacar `npm run prisma:generate` y `prisma:db:push` del flujo manual.

- [ ] Ejecutar `prisma generate` automáticamente (en el build y/o al iniciar el container).
- [ ] Sincronizar el schema al iniciar en desarrollo, según lo decidido en la Fase 0:
  - `prisma db push`, o
  - `prisma migrate deploy` (con migraciones ya creadas con `migrate dev`).
- [ ] Comprobar que Prisma Client existe dentro del container.
- [ ] Comprobar la conexión con PostgreSQL.
- [ ] Comprobar que se usa el schema correcto (`solution_template`) y que las tablas aparecen ahí.
- [ ] (Opcional) Probar Prisma Studio desde el host usando `localhost:5433`.

---

## Fase 10 — Probar instalación desde cero

Una de las pruebas más importantes.

```bash
docker compose down -v
docker compose up --build
```

⚠️ `-v` borra los datos de la base local.

El objetivo es no ejecutar ningún comando de Node manualmente.

- [ ] PostgreSQL inicia.
- [ ] El schema se crea.
- [ ] El backend inicia.
- [ ] Prisma funciona y las tablas existen.
- [ ] El frontend inicia.
- [ ] La API responde.
- [ ] El frontend puede llamar a la API.
- [ ] El hot reload funciona en ambos.

---

## Fase 11 — Simplificar el README

El README debe dejar de decir esto como flujo principal:

```bash
npm install
npm --prefix frontend install
docker compose up -d db
npm run prisma:generate
npm run prisma:db:push
npm run dev
```

El flujo principal pasa a ser:

```bash
git clone <URL>
cd <PROYECTO>
cp .env.example .env
docker compose up --build
```

Y después:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health: http://localhost:3000/api/health

- [ ] Actualizar requisitos (Docker y Docker Compose; Node ya no es necesario).
- [ ] Actualizar instalación.
- [ ] Documentar las variables de entorno.
- [ ] Documentar comandos Docker útiles (`logs`, `exec`, `down`, `up --build -V`).
- [ ] Documentar cómo ejecutar migraciones.
- [ ] Documentar cómo resetear la base local (`docker compose down -v`).

---

## Fase 12 — Limpieza

- [ ] Eliminar comandos manuales innecesarios del README.
- [ ] Eliminar configuraciones Docker duplicadas.
- [ ] Revisar `.dockerignore` y `.gitignore` (ya creados en fases anteriores).
- [ ] Confirmar que `.env` y `node_modules` nunca se suben a Git.
- [ ] Revisar logs.
- [ ] Revisar nombres de servicios.
- [ ] Revisar puertos.
- [ ] Revisar variables de entorno.

---

## Fase 13 — Commit

```bash
git status
```

- [ ] Revisar los cambios.
- [ ] Confirmar que no se agregó `.env`.
- [ ] Confirmar que no se agregaron `node_modules`.
- [ ] Confirmar que ambos Dockerfiles, `.dockerignore`, `.env.example` y `docker/` están incluidos.
- [ ] Confirmar que `docker-compose.yml` y el README están actualizados.

```bash
git add .
git commit -m "feat: dockerize local development environment"
git push -u origin feat/docker-dev-environment
```

---

## Fase 14 — Railway

Solo después de completar absolutamente todo lo anterior.

```
Docker local ──► mismo Dockerfile, target `production` ──► Railway
```

- [ ] Completar el stage `production` del Dockerfile (sin nodemon, sin volúmenes, comando `node`/`npm start`).
- [ ] Confirmar que el backend lee `PORT` dinámico.
- [ ] Crear el PostgreSQL de Railway.
- [ ] Configurar las variables de entorno en Railway (`DATABASE_URL`, etc.).
- [ ] Ejecutar migraciones con `prisma migrate deploy` (no `db push`) en el deploy.
- [ ] Deploy del backend.
- [ ] Frontend: build estático (Vite build) servido por separado, o integrado al backend.
- [ ] Deploy independiente por servicio, actualizando solo el que cambió.

---

## Errores clásicos (referencia rápida)

| Síntoma | Causa probable |
|---|---|
| `localhost:5432` connection refused desde el backend | `DATABASE_URL` usa `localhost` en vez de `db` |
| El frontend no llega a la API | `VITE_API_URL` apunta a `backend:3000` en vez de `localhost:3000`, o falta CORS |
| El hot reload no detecta cambios | Windows/WSL sin polling (`nodemon -L`, `usePolling: true`) |
| Módulo nuevo "not found" tras `npm install` | Volumen viejo de `node_modules`: `up --build -V` |
| `01-init.sql` no se ejecutó | El volumen ya existía: `down -v` (borra datos) |
| Prisma falla con error de `libssl` | Falta `openssl` en la imagen o se usa `alpine` |
| Puerto 5432 ocupado | Postgres local: mapear `5433:5432` |