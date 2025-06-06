# Multi-stage build for production optimization
FROM node:18-alpine AS dependencies

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# Build stage
FROM dependencies AS builder
COPY . .
RUN npm ci && npm run build

# Production stage (for deployment)
FROM nginx:alpine AS production
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]