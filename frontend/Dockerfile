# Nuclear Dockerfile - Run as root to avoid permission issues on Windows
FROM node:18-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache bash

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci --silent && npm cache clean --force

# Copy source code
COPY . .

# Create cache directory with full permissions (running as root)
RUN mkdir -p /app/node_modules/.cache && \
    chmod -R 777 /app/node_modules && \
    chmod -R 777 /app

# Expose port
EXPOSE 3000

# Run as root (no USER directive) to avoid permission issues
CMD ["npm", "start"]