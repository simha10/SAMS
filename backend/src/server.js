const mongoose = require('mongoose');
const app = require('./App.js');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { startCrons } = require('./jobs/startCrons');

// Load environment variables only when PLATFORM is not 'gcp'
if (process.env.PLATFORM !== 'gcp') {
    require('dotenv').config();
} else {
    console.log('PLATFORM is set to gcp, skipping dotenv loading');
}

// Initialize cron jobs (controlled by RUN_CRON environment variable)
// Only run cron jobs if explicitly enabled (typically only on one instance)
const runCron = process.env.RUN_CRON === 'true';
console.log('=== CRON CONFIGURATION ===');
console.log('RUN_CRON environment variable:', process.env.RUN_CRON || 'NOT SET');
console.log('Cron jobs will run:', runCron);
console.log('=== END CRON CONFIGURATION ===');

if (runCron) {
  startCrons();
  console.log('Cron jobs started');
} else {
  console.log('Cron jobs disabled - set RUN_CRON=true to enable');
}

console.log("=== SERVER STARTUP ===");
console.log("Environment:", process.env.NODE_ENV || 'development');
console.log("Port:", process.env.PORT || 5000);
console.log("Mongo URI:", process.env.MONGO_URI ? '***' : 'NOT SET');
console.log("JWT Secret:", process.env.JWT_SECRET ? '***' : 'NOT SET');
console.log("Frontend URL:", process.env.FRONTEND_URL || 'http://localhost:5173');
console.log("=== END SERVER STARTUP ===");

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI?.trim();

if (!mongoUri) {
  console.error('=== MONGODB CONNECTION ERROR ===');
  console.error('MONGO_URI is missing or empty at runtime');
  console.error('Please set the MONGO_URI environment variable in Cloud Run');
  console.error('=== END MONGODB CONNECTION ERROR ===');
  
  // Don't exit immediately - allow health check to work
  // The app will fail when actual database operations are attempted
  process.exitCode = 1;
} else {
  console.log('MONGO_URI starts with:', mongoUri.slice(0, 15));

  mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log('=== MONGODB CONNECTED ===');
      console.log('MongoDB connected successfully');
      console.log('=== END MONGODB CONNECTED ===');
    })
    .catch((err) => {
      console.error('=== MONGODB CONNECTION ERROR ===');
      console.error('MongoDB connection error:', err);
      console.error('Error code:', err.code || 'N/A');
      console.error('Error name:', err.name || 'N/A');
      console.error('=== END MONGODB CONNECTION ERROR ===');
      
      // Don't exit immediately - allow health check to work
      // The app will fail when actual database operations are attempted
      process.exitCode = 1;
    });
}

// Connect to Redis
connectRedis()
  .then(() => {
    console.log('=== REDIS CONNECTED ===');
    console.log('Redis connected successfully');
    console.log('=== END REDIS CONNECTED ===');
  })
  .catch((err) => {
    console.error('=== REDIS CONNECTION ERROR ===');
    console.error('Redis connection error:', err);
    console.error('=== END REDIS CONNECTION ERROR ===');
    // Don't exit here - allow the app to run without Redis if needed
    console.warn('App will continue without Redis - some features may be limited');
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', async (err) => {
  console.error('=== UNHANDLED PROMISE REJECTION ===');
  console.error('Unhandled Promise Rejection:', err);
  console.error('=== END UNHANDLED PROMISE REJECTION ===');

  // Attempt graceful shutdown
  try {
    await disconnectRedis();
  } catch (e) {
    console.error('Error during Redis disconnection:', e);
  }

  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (err) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Uncaught Exception:', err);
  console.error('=== END UNCAUGHT EXCEPTION ===');

  // Attempt graceful shutdown
  try {
    await disconnectRedis();
  } catch (e) {
    console.error('Error during Redis disconnection:', e);
  }

  process.exit(1);
});

// Add a basic ping endpoint that works without DB connection
app.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server first to handle health checks even if DB fails
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('=== SERVER STARTED ===');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=== END SERVER STARTED ===');
});

// Set a timeout to make sure the server stays up even if DB connection fails
setTimeout(() => {
  console.log('Server health check: Server is running and accepting requests');
}, 5000);

// Periodic status logging to help with debugging in Cloud Run
setInterval(() => {
  const dbState = mongoose.connection.readyState;
  const dbStateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';
  
  console.log(`=== SERVER STATUS ===`);
  console.log(`Database connection state: ${dbStateText}`);
  console.log(`Server is listening on port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MONGO_URI available: ${!!process.env.MONGO_URI}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`=== END SERVER STATUS ===`);
}, 60000); // Log every minute

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('=== SIGTERM RECEIVED ===');
  console.log('SIGTERM received, shutting down gracefully');

  // Close server
  server.close(async () => {
    console.log('HTTP server closed');

    // Disconnect from Redis
    try {
      await disconnectRedis();
    } catch (e) {
      console.error('Error during Redis disconnection:', e);
    }

    console.log('Process terminated');
    console.log('=== END SIGTERM RECEIVED ===');
  });
});

process.on('SIGINT', async () => {
  console.log('=== SIGINT RECEIVED ===');
  console.log('SIGINT received, shutting down gracefully');

  // Close server
  server.close(async () => {
    console.log('HTTP server closed');

    // Disconnect from Redis
    try {
      await disconnectRedis();
    } catch (e) {
      console.error('Error during Redis disconnection:', e);
    }

    console.log('Process terminated');
    console.log('=== END SIGINT RECEIVED ===');
  });
});