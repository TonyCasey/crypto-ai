# Frontend Dockerfile for CryptoBot Node.js Migration
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json pnpm-lock.yaml ./

# Copy workspace package files
COPY packages/*/package.json ./packages/*/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development

# Copy source files
COPY packages/ ./packages/
COPY frontend/ ./frontend/

# Build packages
RUN pnpm run build:packages

# Expose port
EXPOSE 3000

# Start development server
WORKDIR /app/frontend
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]

# Build stage
FROM base AS build

# Copy source files
COPY packages/ ./packages/
COPY frontend/ ./frontend/

# Build packages first
RUN pnpm run build:packages

# Build frontend
RUN cd frontend && pnpm run build

# Production stage
FROM nginx:alpine AS production

# Create nginx user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S frontend -u 1001

# Copy built assets
COPY --from=build --chown=frontend:nodejs /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY --from=build /app/frontend/nginx.conf /etc/nginx/nginx.conf

# Copy custom nginx config for SPA
RUN echo 'server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (if needed)
    location /api {
        proxy_pass $API_URL;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}' > /etc/nginx/conf.d/default.conf

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

# Switch to non-root user
USER frontend

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]