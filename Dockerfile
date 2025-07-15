# Railway BlackRent Dockerfile - Force rebuild
FROM node:18-alpine

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

# Create final working directory
WORKDIR /blackrent-app/backend

# Copy built frontend
RUN cp -r ../build ./build

# Expose port
EXPOSE 5001

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/index.js"] 