FROM node:18-alpine

WORKDIR /app

# Copy dependency definitions first
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --no-audit --no-fund

# Copy backend source
COPY src ./src
COPY scripts ./scripts

# Cloud Run standard port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
