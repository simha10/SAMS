const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim();

    if (!mongoUri) {
      throw new Error('MONGO_URI is missing or empty at runtime');
    }

    const conn = await mongoose
      .connect(mongoUri, {
        retryWrites: true,
        w: 'majority',
        // Connection pool settings for better performance
        maxPoolSize: process.env.NODE_ENV === 'production' ? 20 : 10, // Max connections in pool
        minPoolSize: process.env.NODE_ENV === 'production' ? 5 : 2,   // Min connections in pool
        maxIdleTimeMS: 30000,  // Close connections after 30 seconds of inactivity
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
      });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`MongoDB Connection Pool: ${conn.connection.readyState}`);

    // Log connection pool stats
    const db = mongoose.connection;

    // Handle connection events
    db.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    db.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    db.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;