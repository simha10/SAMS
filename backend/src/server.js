const mongoose = require('mongoose');
const app = require('./App');
require('dotenv').config();

// Initialize cron jobs
require('./jobs/daily');
require('./jobs/autoCheckout');

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

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('=== UNHANDLED PROMISE REJECTION ===');
  console.error('Unhandled Promise Rejection:', err);
  console.error('=== END UNHANDLED PROMISE REJECTION ===');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Uncaught Exception:', err);
  console.error('=== END UNCAUGHT EXCEPTION ===');
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
process.on('SIGTERM', () => {
  console.log('=== SIGTERM RECEIVED ===');
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    console.log('=== END SIGTERM RECEIVED ===');
  });
});