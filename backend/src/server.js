const mongoose = require('mongoose');
const app = require('./app');
const { connectRedis, disconnectRedis } = require('./config/redis');
require('dotenv').config();

// Initialize cron jobs
require('./jobs/daily');
require('./jobs/autoCheckout');
require('./jobs/birthdayNotifications');

console.log("=== SERVER STARTUP ===");
console.log("Environment:", process.env.NODE_ENV || 'development');
console.log("Port:", process.env.PORT || 5000);
console.log("Mongo URI:", process.env.MONGO_URI ? '***' : 'NOT SET');
console.log("JWT Secret:", process.env.JWT_SECRET ? '***' : 'NOT SET');
console.log("Frontend URL:", process.env.FRONTEND_URL || 'http://localhost:5173');
console.log("=== END SERVER STARTUP ===");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('=== MONGODB CONNECTED ===');
    console.log('MongoDB connected successfully');
    console.log('=== END MONGODB CONNECTED ===');
  })
  .catch((err) => {
    console.error('=== MONGODB CONNECTION ERROR ===');
    console.error('MongoDB connection error:', err);
    console.error('=== END MONGODB CONNECTION ERROR ===');
    process.exit(1);
  });

// Connect to Redis
connectRedis().catch((err) => {
  console.error('=== REDIS CONNECTION ERROR ===');
  console.error('Redis connection error:', err);
  console.error('=== END REDIS CONNECTION ERROR ===');
  // Don't exit here - allow the app to run without Redis if needed
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

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('=== SERVER STARTED ===');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=== END SERVER STARTED ===');
});

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