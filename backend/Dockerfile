FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app
RUN chown nodejs:nodejs /app
USER nodejs

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Development stage
FROM base AS development
RUN npm ci
COPY --chown=nodejs:nodejs . .
EXPOSE 5000
CMD ["dumb-init", "npm", "run", "dev"]

# Production dependencies
FROM base AS dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM base AS production
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .
EXPOSE 5000
CMD ["dumb-init", "node", "server.js"]