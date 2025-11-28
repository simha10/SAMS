# -----------------------------------------------------------------------------
# Stage 1: Build & Install Dependencies
# -----------------------------------------------------------------------------
FROM node:20-slim AS builder

# Install build tools needed for any native C/C++ node modules (like bcrypt or node-sqlite3)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory for the app
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies using npm install (more robust than npm ci for some environments)
# Switching to 'npm install' to bypass the error 1 seen with 'npm ci'
RUN npm install

# -----------------------------------------------------------------------------
# Stage 2: Final Production Image
# -----------------------------------------------------------------------------
FROM node:20-slim

# Set working directory for the app
WORKDIR /usr/src/app

# Copy all installed node modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the rest of the application source code
COPY . .

# Set environment variables for Cloud Run runtime
ENV NODE_ENV production
ENV PORT 8080

# Expose the port the app listens on
EXPOSE 8080

# Define the command to run your application
# Ensure 'App.js' is the correct entry point from your 'src' folder
CMD ["node", "src/App.js"]