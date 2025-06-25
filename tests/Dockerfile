# Optimized test container
FROM node:18-alpine AS test

# Add necessary packages for testing
RUN apk add --no-cache curl wget

WORKDIR /app

# Update npm to latest compatible version for Node 18
RUN npm install -g npm@10.9.2

# Create non-root user first
RUN addgroup -g 1001 -S testuser && adduser -S testuser -u 1001

# Change ownership of the app directory before installing dependencies
RUN chown -R testuser:testuser /app

# Switch to testuser before copying files and installing dependencies
USER testuser

# Copy package files and install dependencies as testuser
COPY --chown=testuser:testuser package*.json ./
RUN npm ci && npm cache clean --force

# Copy necessary source files as testuser
COPY --chown=testuser:testuser tests/ ./tests/
COPY --chown=testuser:testuser backend/ ./backend/
COPY --chown=testuser:testuser database/ ./database/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

CMD ["tail", "-f", "/dev/null"]