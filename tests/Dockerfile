FROM node:18-alpine

WORKDIR /app

# Copy package files from root (they're already consolidated)
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source files
COPY tests/ ./tests/
COPY backend/ ./backend/
COPY database/ ./database/

CMD ["tail", "-f", "/dev/null"]