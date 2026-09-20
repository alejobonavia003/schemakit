# Versión de Node: ajustala a la que usa tu proyecto (node -v)
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-slim

WORKDIR /app

# Primero solo lo necesario para instalar (aprovecha la caché de Docker)
COPY package.json package-lock.json ./
RUN npm ci

# Después el resto del código
COPY . .

EXPOSE 5173

# --host 0.0.0.0 hace que Vite escuche en todas las interfaces,
# si no, no sería accesible desde fuera del container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
