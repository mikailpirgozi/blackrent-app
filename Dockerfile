# Simple Railway Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install frontend dependencies and build
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Install backend dependencies  
WORKDIR /app/backend
RUN npm ci --only=production

# Copy built frontend to backend build directory
RUN cp -r ../build /app/backend/build

# Expose port
EXPOSE 5001

# Set environment
ENV NODE_ENV=production

# Start backend (now uses src/index.js)
CMD ["npm", "start"] 