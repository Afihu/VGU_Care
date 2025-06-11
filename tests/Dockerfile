# Optimized test container
FROM node:18-alpine AS test

# Add necessary packages for testing
RUN apk add --no-cache curl wget

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy necessary source files
COPY tests/ ./tests/
COPY backend/ ./backend/
COPY database/ ./database/

# Create non-root user
RUN addgroup -g 1001 -S testuser && adduser -S testuser -u 1001
USER testuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

CMD ["tail", "-f", "/dev/null"]