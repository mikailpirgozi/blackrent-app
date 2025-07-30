# Multi-stage build pre Blackrent monorepo
FROM node:18-alpine AS builder

# Nastavenie pracovného adresára
WORKDIR /app

# Kopírovanie package.json files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Inštalácia závislostí
RUN npm ci --only=production --silent

# Inštalácia backend závislostí
WORKDIR /app/backend
RUN npm ci --only=production --silent

# Návrat do root
WORKDIR /app

# Kopírovanie source kódu
COPY . .

# Build procesu
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Vytvorenie non-root používateľa
RUN addgroup -g 1001 -S nodejs
RUN adduser -S blackrent -u 1001

# Nastavenie pracovného adresára
WORKDIR /app

# Kopírovanie package.json files
COPY --from=builder /app/backend/package*.json ./
RUN npm ci --only=production --silent && npm cache clean --force

# Kopírovanie built aplikácie
COPY --from=builder --chown=blackrent:nodejs /app/backend/dist ./dist

# Nastavenie používateľa
USER blackrent

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Spustenie aplikácie
CMD ["node", "dist/index.js"] 