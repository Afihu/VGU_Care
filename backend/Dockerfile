# Use smaller Alpine image and specific Node version
FROM node:18-alpine AS base

# Add necessary packages for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies based on environment
FROM base AS development
ENV NODE_ENV=development
# Use npm ci for faster, reliable, reproducible builds
RUN npm ci --only=production && npm ci --only=development && npm cache clean --force

# Copy source code
COPY backend/ ./backend/
COPY database/ ./database/

EXPOSE 5001
USER node
CMD ["node", "backend/server.js"]

FROM base AS production  
ENV NODE_ENV=production
# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY backend/ ./backend/
COPY database/ ./database/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5001
CMD ["node", "backend/server.js"]