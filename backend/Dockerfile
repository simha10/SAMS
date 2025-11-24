# --- Build Stage ---
FROM node:18-bullseye AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with bcrypt compiled for Linux (Debian)
RUN npm install --production

# Copy source
COPY . .

# --- Production Stage ---
FROM node:18-bullseye
WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy app code
COPY --from=builder /app/ ./

# Remove .env if copied
RUN rm -f .env

# Create non-root user
RUN useradd -m expressuser
USER expressuser

EXPOSE 8080

CMD ["node", "src/server.js"]
