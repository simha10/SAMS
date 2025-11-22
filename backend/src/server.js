const mongoose = require('mongoose');
const app = require('./App');
require('dotenv').config();

// Import logger and secrets
const logger = require('./utils/logger');
const { initializeSecrets } = require('./utils/secrets');

// Remove automatic cron job initialization
// require('./jobs/daily');     // REMOVED
// require('./jobs/autoCheckout'); // REMOVED

// Initialize secrets if using Secret Manager
initializeSecrets().then(() => {
  logger.info("=== SERVER STARTUP ===");
  logger.info("Environment:", process.env.NODE_ENV || 'development');
  logger.info("Port:", process.env.PORT || 5000);
  logger.info("Mongo URI set:", !!process.env.MONGO_URI);
  logger.info("JWT Secret set:", !!process.env.JWT_SECRET);
  logger.info("Frontend URL:", process.env.FRONTEND_URL || 'http://localhost:5173');
  logger.info("=== END SERVER STARTUP ===");

  // Connect to MongoDB
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info('=== MONGODB CONNECTED ===');
    logger.info('MongoDB connected successfully');
    logger.info('=== END MONGODB CONNECTED ===');
  })
  .catch((err) => {
    logger.error('=== MONGODB CONNECTION ERROR ===');
    logger.error('MongoDB connection error:', err);
    logger.error('=== END MONGODB CONNECTION ERROR ===');
    process.exit(1);
  });
}).catch(error => {
  logger.error('Failed to initialize secrets:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('=== UNHANDLED PROMISE REJECTION ===');
  logger.error('Unhandled Promise Rejection:', err);
  logger.error('=== END UNHANDLED PROMISE REJECTION ===');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('=== UNCAUGHT EXCEPTION ===');
  logger.error('Uncaught Exception:', err);
  logger.error('=== END UNCAUGHT EXCEPTION ===');
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info('=== SERVER STARTED ===');
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('=== END SERVER STARTED ===');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('=== SIGTERM RECEIVED ===');
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    logger.info('=== END SIGTERM RECEIVED ===');
  });
});