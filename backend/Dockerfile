# Stage 1: Builder (For installing dependencies, including native ones)
FROM node:18-slim AS builder
WORKDIR /app

# Install build tools needed for packages like bcryptjs
# This is crucial for a smooth npm install
RUN apt-get update && apt-get install -y python3 make g++

COPY package*.json ./
# npm ci ensures exact dependency versions from package-lock.json
RUN npm ci 

COPY . .

# Stage 2: Production (A clean, minimal runtime environment)
FROM node:18-slim
WORKDIR /app

# Copy only the necessary files for runtime from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

# Environment variables
ENV NODE_ENV=production

# Cloud Run listens on 8080 by default
EXPOSE 8080

# This is your application's start command
CMD ["node", "src/server.js"]