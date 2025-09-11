# Backend Dockerfile for CryptoBot Node.js Migration
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json pnpm-lock.yaml ./

# Copy workspace package files
COPY packages/*/package.json ./packages/*/
COPY backend/package*.json ./backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build

# Copy source files
COPY packages/ ./packages/
COPY backend/ ./backend/

# Build packages first
RUN pnpm run build:packages

# Build backend
RUN cd backend && pnpm run build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

WORKDIR /app

# Copy package files
COPY --from=build --chown=backend:nodejs /app/package*.json ./
COPY --from=build --chown=backend:nodejs /app/pnpm-lock.yaml ./
COPY --from=build --chown=backend:nodejs /app/backend/package*.json ./backend/

# Copy built packages
COPY --from=build --chown=backend:nodejs /app/packages/*/dist ./packages/*/dist/
COPY --from=build --chown=backend:nodejs /app/packages/*/package.json ./packages/*/

# Copy built backend
COPY --from=build --chown=backend:nodejs /app/backend/dist ./backend/dist/
COPY --from=build --chown=backend:nodejs /app/backend/prisma ./backend/prisma/

# Install production dependencies only
ENV NODE_ENV=production
RUN pnpm install --frozen-lockfile --prod

# Switch to non-root user
USER backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
WORKDIR /app/backend
CMD ["node", "dist/index.js"]