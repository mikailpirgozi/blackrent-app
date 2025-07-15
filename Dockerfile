# Railway BlackRent Dockerfile - Updated with Node 20+
FROM node:20-alpine

# Create app directory
WORKDIR /blackrent-app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Move to backend directory
WORKDIR /blackrent-app/backend

# Install backend dependencies
RUN npm install

# Build TypeScript backend
RUN npm run build

# Copy built frontend to backend build directory
RUN cp -r ../build ./build

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production

# Start the application using compiled TypeScript
CMD ["node", "dist/index.js"] 