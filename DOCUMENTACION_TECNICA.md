# Documentación técnica del sistema

## 1. Propósito del proyecto

Este repositorio funciona como base para una aplicación web con backend en Express y frontend en React + Vite. La intención principal es ofrecer una estructura limpia, modular y extensible para que un equipo trabaje sobre varias soluciones o módulos dentro del mismo monorepo.

La arquitectura actual ya incluye PostgreSQL como capa de persistencia y Prisma como ORM. Esto permite que el proyecto se pueda ejecutar localmente con una base real, manteniendo el mismo flujo de migraciones para producción.

---

## 2. Visión general de la arquitectura

El sistema está compuesto por tres capas principales:

1. Frontend React + Vite
2. Backend Express + API REST
3. PostgreSQL + Prisma para persistencia

### Diagrama de flujo

```text
+---------------------+
| Frontend React      |
| Vite + React        |
| src/App.jsx         |
+----------+----------+
           |
           | HTTP / JSON
           v
+---------------------+
| Backend Express     |
| src/app.js          |
| src/server.js       |
| src/routes/*        |
| src/controllers/*  |
+----------+----------+
           |
           | Prisma Client
           v
+---------------------+
| PostgreSQL          |
| Docker local        |
| prisma/schema.prisma|
+---------------------+
```

En desarrollo, la base de datos corre en Docker. En producción, la idea es reutilizar el mismo esquema de Prisma y la misma lógica de migraciones, con la `DATABASE_URL` definida por el entorno provisto por Railway.

---

## 3. Estructura del repositorio

```text
ladies/
├── README.md
├── DOCUMENTACION_TECNICA.md
├── docker-compose.yml
├── package.json
├── .env.example
├── .gitignore
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── index.js
│   │   └── prisma.js
│   ├── controllers/
│   │   └── example.controller.js
│   ├── middlewares/
│   ├── routes/
│   └── generated/prisma/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
└── ...
```

### Carpetas relevantes

#### `src/`
- `app.js`: configuración global de Express, CORS, JSON y rutas.
- `server.js`: arranque del servidor.
- `config/index.js`: variables de entorno y configuración general.
- `config/prisma.js`: instancia global de PrismaClient.
- `controllers/`: lógica de negocio por recurso.
- `routes/`: endpoints REST.

#### `prisma/`
- `schema.prisma`: schema principal de Prisma y definición de modelos.
- `migrations/`: migraciones versionadas del esquema.

#### `frontend/`
- `src/services/api.js`: cliente HTTP para consumir el backend.
- `src/solucion1` y `src/solucion2`: módulos funcionales del proyecto.

---

## 4. Configuración de entorno

El proyecto usa variables de entorno centralizadas a través de `dotenv`.

### Variables relevantes

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://ladies:ladies_dev@localhost:5432/ladies?schema=public"
```

- `PORT`: puerto del backend local.
- `NODE_ENV`: entorno de ejecución.
- `DATABASE_URL`: conexión a PostgreSQL.

El archivo `.env` no se versiona; se copia desde `.env.example` en cada entorno local.

---

## 5. PostgreSQL local con Docker

El proyecto incluye un servicio Docker para levantar la base local:

```yaml
services:
  db:
    image: postgres:16
    container_name: ladies-db
    environment:
      POSTGRES_USER: ladies
      POSTGRES_PASSWORD: ladies_dev
      POSTGRES_DB: ladies
    ports:
      - "5432:5432"
```

Comando para levantarlo:

```bash
docker compose up -d
```

Esto deja PostgreSQL disponible en `localhost:5432` para desarrollo.

---

## 6. Prisma y migraciones

El schema principal se define en `prisma/schema.prisma`.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Example {
  id   Int    @id @default(autoincrement())
  name String
}
```

### Comandos principales

```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma db push
```

La convención del proyecto es versionar los cambios con migraciones, así el esquema queda reproducible en cualquier entorno: local, staging o producción.

### Importante

La carpeta `prisma/migrations/` queda como fuente de verdad para el historial de cambios de datos y estructura. Esto permite que Railway pueda aplicar el mismo flujo con:

```bash
npx prisma migrate deploy
```

sin depender de cambios manuales.

---

## 7. Backend y endpoints

El router principal levanta el API bajo `/api` y expone recursos como `health` y `examples`.

### Endpoints incluidos

- `GET /api/health`
- `GET /api/examples`
- `GET /api/examples/:id`
- `POST /api/examples`

El controlador de ejemplo ya no devuelve datos simulados en memoria; usa `PrismaClient` para consultar la base real.

Ejemplo de lógica:

```js
const examples = await prisma.example.findMany({
  orderBy: { id: 'asc' },
});
```

Esto hace que el backend quede preparado para trabajar con datos reales y para que cualquier endpoint nuevo pueda reutilizar la misma capa de acceso a datos.

---

## 8. Frontend y comunicación con la API

El frontend consume la API a través de `frontend/src/services/api.js`.

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

Esto permite:

- usar `localhost` en desarrollo,
- cambiar la URL de API en producción por la de Railway,
- y mantener el mismo contrato HTTP del backend.

En local, el frontend se ejecuta por separado y apunta a `http://localhost:3000/api` si no se define `VITE_API_URL`.

---

## 9. Flujo de trabajo para desarrolladores

### Setup inicial

```bash
npm install
cd frontend && npm install && cd ..
cp .env.example .env
```

### Levantar Postgres local

```bash
docker compose up -d
```

### Aplicar migraciones

```bash
npx prisma migrate dev --name init
```

### Iniciar backend

```bash
npm run dev
```

### Iniciar frontend

```bash
cd frontend
npm run dev
```

### Verificar base de datos

Se puede consultar la tabla `Example` directamente desde PostgreSQL o usando Prisma Studio:

```bash
npx prisma studio
```

---

## 10. Estado de despliegue y producción

### Implementado

- Base local con Docker
- Prisma con schema versionado
- migraciones en repo
- backend conectándose a PostgreSQL real

### Pendiente

La integración final con Railway y Vercel todavía no está implementada. Esto incluye:

- crear el servicio en Railway con PostgreSQL
- configurar la variable `DATABASE_URL` generada por Railway
- usar `npx prisma migrate deploy` en el comando de deploy
- configurar `VITE_API_URL` en Vercel con la URL pública del backend
- ajustar `cors()` para aceptar el origen del frontend desplegado

Esta parte queda documentada como siguiente paso de despliegue y no se considera completa todavía.

---

## 11. Buenas prácticas del proyecto

- Mantener `.env` fuera del control de versiones.
- No editar manualmente la carpeta `src/generated/prisma/`.
- Generar y versionar migraciones para cualquier cambio estructural.
- Mantener cada recurso separado en controller + route + modelo Prisma.
- Usar `DATABASE_URL` para diferenciar entornos sin tocar el código.

La estructura del proyecto está planeada para crecer sin reescribir la base de la aplicación: un mismo backend, un mismo modelo de datos y un frontend modular que consume la API de forma consistente.


El backend incluye dos middlewares clave:

- `notFound`: se ejecuta cuando la ruta no existe.
- `errorHandler`: captura errores y responde con un JSON formal de error.

La idea es centralizar la gestión de errores para no repetir lógica en todos los controladores.

---

## 5. Frontend: cómo funciona

### 5.1. Stack principal

El frontend usa:

- React 19
- Vite
- JavaScript con módulos ES

Esto permite un flujo de desarrollo rápido con reemplazo en caliente y una estructura modular.

### 5.2. Punto de entrada de la UI

`frontend/src/main.jsx` carga la aplicación principal dentro del DOM.

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

`App.jsx` es el componente raíz de la interfaz.

### 5.3. Componente principal

En `frontend/src/App.jsx` la app hace lo siguiente:

- usa `useState` para guardar `examples` y `status`
- llama a `getExamples()` al montar el componente
- actualiza el estado según la respuesta del backend
- renderiza el estado de carga, éxito o error
- y muestra una zona de “módulos” para futuras soluciones

Esto deja una base de UI muy clara para extender con más secciones o módulos dinámicos.

### 5.4. Cliente API centralizado

El archivo `frontend/src/services/api.js` encapsula todas las llamadas HTTP al backend.

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`La API respondió con el estado ${response.status}`)
  }

  return response.json()
}

export async function getExamples() {
  const result = await request('/examples')
  return result.data
}
```

Esto es importante porque:

- centraliza la URL base,
- evita duplicar fetch en cada componente,
- encapsula manejo de errores,
- y hace más fácil cambiar la API en el futuro.

### 5.5. Flujo de datos frontend -> backend

Un flujo típico es:

1. El usuario entra a la pantalla principal.
2. `App.jsx` monta y ejecuta `getExamples()`.
3. `services/api.js` genera una petición a `http://localhost:3000/api/examples`.
4. Express responde con JSON.
5. El frontend guarda los datos en estado local.
6. La UI renderiza los ejemplos o un mensaje de error.

---

## 6. Cómo funciona el sistema en conjunto

El proyecto funciona como una API REST con una app cliente que consume sus endpoints. Su patrón base es:

- backend expone recursos REST,
- frontend usa fetch para consumirlos,
- cada recurso tiene un controller y un router separado,
- y la UI puede presentar datos desde ese backend sin lógica compleja.

### Patrón recomendado para nuevas features

Cuando se quiera agregar un nuevo recurso, el flujo esperado es:

1. Crear o editar el controlador.
2. Crear o editar el router del recurso.
3. Registrar la ruta principal en `src/routes/index.js`.
4. Crear el servicio correspondiente en `frontend/src/services/`.
5. Integrar la llamada en un componente React.

Ejemplo de convención:

```text
src/controllers/user.controller.js
src/routes/user.routes.js
frontend/src/services/user.js
frontend/src/components/UserPanel.jsx
```

---

## 7. Convención de módulos y soluciones

El repositorio trae carpetas llamadas `solucion1` y `solucion2` como puntos de extensión.

Esto indica que el proyecto está pensado para evolucionar en varios módulos, por ejemplo:

- una solución de administración,
- otra de inventario,
- otra de reportes,
- o distintas funcionalidades independientes pero compartiendo el mismo backend base.

La estructura sugiere un enfoque de trabajo modular:

- lógica separada por dominio,
- módulos y servicios especializados,
- interfaces compartidas en frontend,
- y una estructura más fácil de mantener a medida que crece el sistema.

---

## 8. Dependencias principales

### Backend

`package.json` raíz incluye:

- `express`: framework HTTP para construir la API.
- `cors`: habilita CORS para llamadas desde frontend/local.
- `dotenv`: carga variables de entorno desde `.env`.
- `morgan`: logs HTTP.
- `nodemon` en dev: reinicio automático del servidor.

### Frontend

`frontend/package.json` incluye:

- `react` y `react-dom`: librerías de UI.
- `vite`: herramienta de desarrollo y build.
- `@vitejs/plugin-react`: integración de React con Vite.
- `oxlint`: linter.

---

## 9. Comandos de ejecución

### Backend

Desde la raíz:

```bash
npm install
npm run dev
```

Esto levanta el servidor backend en modo desarrollo, con `node --watch` o equivalente según configuración.

### Frontend

Desde `frontend/`:

```bash
npm install
npm run dev
```

El frontend normalmente corre en:

```text
http://localhost:5173
```

El backend normalmente corre en:

```text
http://localhost:3000
```

### Verificación rápida

La API tiene una ruta de salud:

```text
GET /api/health
```

Y una ruta de ejemplo:

```text
GET /api/examples
```

---

## 10. Qué debe entender una IA o un MCP sobre este proyecto

Para operar bien con este repositorio, una IA debería asumir lo siguiente:

1. Es un proyecto de plantilla para API REST + frontend modular.
2. La capa backend es Express y está montada en `/api`.
3. Los endpoints se registran por recurso en `src/routes/`.
4. La lógica del negocio vive en `src/controllers/`.
5. El frontend no toca la API directamente sino a través de `frontend/src/services/api.js`.
6. El proyecto aún no usa persistencia, autenticación ni base de datos.
7. La estructura de carpetas está pensada para crecer en “soluciones” o módulos independientes.
8. El patrón recomendado es: recurso -> route -> controller -> service -> UI.

Esto ayuda a explicar el sistema como un scaffold base para construir una aplicación más grande sin perder claridad ni modularidad.

---

## 11. Resumen ejecutivo

El repositorio es un starter para una aplicación web full-stack pequeña pero escalable:

- Express expone una API REST,
- React + Vite consume los datos,
- ambos están separados por responsabilidades,
- la estructura está preparada para crecer con varios módulos,
- y el flujo de trabajo sigue convenciones claras para añadir nuevas funcionalidades.

No es una aplicación de negocio completa; es una base de arquitectura que permite empezar a construir servicios, pantallas y soluciones sin repetir patrones.

---

## 12. Recomendación para continuar

Si el proyecto se va a expandir, el siguiente paso natural es:

- definir modelos de dominio,
- agregar una base de datos (por ejemplo PostgreSQL, MongoDB o SQLite),
- introducir validaciones con Zod o Joi,
- crear servicios reales para cada solución,
- y dividir la UI en componentes y módulos por funcionalidad.

Con esta base, cualquier agente o desarrollador puede entender rápidamente qué hace cada parte del sistema y dónde conviene añadir nuevas capacidades.
