# Mi API

Base de servidor para una API REST con Node.js y Express.

## Estructura del proyecto

```
mi-api/
├── src/
│   ├── config/          # Configuración (variables de entorno, etc.)
│   ├── controllers/     # Lógica de negocio de cada recurso
│   ├── middlewares/     # Middlewares (errores, validaciones, auth...)
│   ├── routes/          # Definición de endpoints
│   ├── app.js           # Configuración de Express (middlewares, rutas)
│   └── server.js        # Punto de entrada, levanta el servidor
├── .env.example
├── .gitignore
└── package.json
```

## Cómo empezar

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Crear el archivo `.env` a partir del ejemplo:
   ```bash
   cp .env.example .env
   ```

3. Levantar el servidor en modo desarrollo (se reinicia solo al guardar cambios):
   ```bash
   npm run dev
   ```

4. Probar que funciona entrando a:
   ```
   http://localhost:3000/api/health
   ```

## Cómo agregar un endpoint nuevo

Supongamos que quieren agregar el recurso `users`. Los pasos son siempre los mismos:

1. **Controlador** (`src/controllers/user.controller.js`): la lógica de qué hace cada endpoint.
2. **Rutas** (`src/routes/user.routes.js`): qué método HTTP y URL dispara cada función del controlador.
3. **Registrar la ruta** en `src/routes/index.js`:
   ```js
   import userRoutes from './user.routes.js';
   router.use('/users', userRoutes);
   ```

Usen `src/controllers/example.controller.js` y `src/routes/example.routes.js` como plantilla, son justo para eso.

## Endpoints de ejemplo incluidos

| Método | Ruta                  | Descripción              |
|--------|-----------------------|---------------------------|
| GET    | /api/health            | Chequeo de que el server anda |
| GET    | /api/examples          | Lista todos los ejemplos |
| GET    | /api/examples/:id      | Trae un ejemplo por id   |
| POST   | /api/examples          | Crea un ejemplo nuevo    |

## Trabajando en equipo (con tu amigo)

- Suban este proyecto a un repositorio de Git (GitHub, GitLab, etc.) apenas puedan, así los dos trabajan sobre el mismo código.
- El `.env` **no se sube** al repo (ya está en `.gitignore`), cada uno crea el suyo local a partir de `.env.example`.
- Cuando agreguen un recurso nuevo, sigan siempre el mismo patrón (controller + routes) para que el código quede prolijo y fácil de leer entre los dos.
- Si más adelante necesitan una base de datos, validaciones (ej. `zod` o `joi`), autenticación (ej. `jsonwebtoken`), o testing (ej. `jest` o `vitest`), esta estructura ya está preparada para sumarlas sin reescribir nada.
