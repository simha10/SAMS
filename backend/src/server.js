const mongoose = require('mongoose');
const app = require('./App');
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

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
  logger.info("Port:", process.env.PORT);
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
    logger.info('MongoDB connected successfully');
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });
}).catch(error => {
  logger.error('Failed to initialize secrets:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});