# Multi-stage build for optimized development and production

# Dependencies stage - cached layer
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Development stage - optimized for hot reloading
FROM node:18-alpine AS development
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

EXPOSE 3000
USER node
CMD ["npm", "start"]

# Build stage - optimized production build
FROM dependencies AS builder
COPY . .
RUN npm run build

# Production stage - minimal nginx image
FROM nginx:alpine AS production
# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Add non-root user for security
RUN addgroup -g 1001 -S nginx && adduser -S nginx -u 1001

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]