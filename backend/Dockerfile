# Use Node.js 18 on Debian Bullseye (non-alpine for better compatibility)
FROM node:18-bullseye-slim

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN useradd -m expressuser

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app code
COPY . .

# Remove .env file if present (security)
RUN rm -f .env

# Change ownership to non-root user
RUN chown -R expressuser:expressuser /app

# Switch to non-root user
USER expressuser

# Expose port for Cloud Run
EXPOSE 8080

# Start the application
CMD ["node", "src/server.js"]