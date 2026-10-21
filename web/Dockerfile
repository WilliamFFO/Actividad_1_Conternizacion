# Imagen del servidor web (Node.js)
FROM node:20-alpine

WORKDIR /app

# Primero solo los manifiestos: Docker reutiliza esta capa en cache si no
# cambian las dependencias.
COPY package*.json ./
RUN npm ci --omit=dev

# Luego el codigo fuente
COPY . .

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# No ejecutar como root dentro del contenedor
USER node

CMD ["node", "server.js"]
