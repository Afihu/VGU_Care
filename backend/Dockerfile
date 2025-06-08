FROM node:18-alpine AS base

WORKDIR /app

# Copy package files from ROOT
COPY package*.json ./

FROM base AS development
RUN npm ci
COPY backend/ ./backend/
COPY database/ ./database/
COPY tests/ ./tests/
EXPOSE 5001
CMD ["node", "backend/server.js"]

FROM base AS production  
RUN npm ci --only=production
COPY backend/ ./backend/
COPY database/ ./database/
EXPOSE 5001
CMD ["node", "backend/server.js"]