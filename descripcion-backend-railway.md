Backend Dockerizado para probar en Railway

Este backend ya quedó preparado para levantarse con Docker, sin necesidad de tener Node o PostgreSQL instalados localmente. La idea es que cualquier persona pueda clonar el proyecto, configurar el archivo .env y levantar el servicio con un solo comando para ver si corre bien antes de pasarlo a Railway.

Cómo correrlo

1. Clonar el proyecto.
2. Crear el archivo .env a partir de .env.example.
3. Asegurarse de que las variables queden bien definidas, por ejemplo:

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ladies
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@db:5432/ladies?schema=solution_template"

Importante: dentro de Docker, la base de datos se conecta con el nombre del servicio db:5432, no con localhost.

4. Levantar el entorno:

docker compose up --build

Esto levanta:
- PostgreSQL en el puerto 5433 del host
- El backend en el puerto 3000

5. Probar la API:

http://localhost:3000/api/health

Si responde correctamente, el backend está corriendo bien.

Si falla la base de datos

Si la base se crea por primera vez y hay problemas, se puede resetear el volumen:

docker compose down -v
docker compose up --build

Esto borra los datos viejos de PostgreSQL y vuelve a crear el entorno limpio.

Preparación para Railway

Cuando esto funcione en Docker, el siguiente paso para Railway es dejar el backend listo para producción:

- usar el puerto que Railway asigna automáticamente
- usar DATABASE_URL de Railway, no localhost
- ejecutar Prisma con migraciones reales:

npx prisma generate
npx prisma migrate deploy

En producción no se usa npm run dev, sino un arranque real del servidor con Node.

Resumen

El backend ya quedó dockerizado y listo para probarse de forma simple con:

docker compose up --build

Si esto corre bien en otra máquina, significa que la app está preparada para una primera prueba de despliegue en Railway y luego ajustar solo los detalles de producción.
