const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const managerRoutes = require('./routes/manager');
const reportRoutes = require('./routes/reports');
const holidayRoutes = require('./routes/holidays');
const publicHolidayRoutes = require('./routes/publicHolidays'); // Public holiday routes
const birthdayRoutes = require('./routes/birthdays'); // Birthday routes
const branchRoutes = require('./routes/branches'); // Branch routes

// Import new routes
const jobsRoutes = require('./routes/jobs');
const healthRoutes = require('./routes/health');

// Import error handler
const { globalErrorHandler } = require('./utils/errorHandler');

// Initialize app
const app = express();

// Log all incoming requests
const logger = require('./utils/logger');

app.use((req, res, next) => {
  logger.info("=== INCOMING REQUEST ===");
  logger.info("Method:", { method: req.method });
  logger.info("URL:", { url: req.url });
  logger.info("IP:", { ip: req.ip });
  logger.info("User-Agent:", { userAgent: req.get('User-Agent') });
  logger.info("Timestamp:", { timestamp: new Date().toISOString() });
  logger.info("=== END INCOMING REQUEST ===");
  next();
});

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment variable
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL;
    let allowedOrigins = [];
    
    if (allowedOriginsEnv) {
      // Split by comma and trim whitespace
      allowedOrigins = allowedOriginsEnv.split(',').map(origin => origin.trim());
    } else {
      // Fallback to default localhost for development
      allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
    }
    
    // In production, strictly enforce allowed origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, be more permissive but still check against list when present
      callback(null, true);
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  // Log when rate limit is hit
  handler: (req, res, next) => {
    logger.warn("=== RATE LIMIT HIT ===");
    logger.warn("IP:", { ip: req.ip });
    logger.warn("Method:", { method: req.method });
    logger.warn("URL:", { url: req.url });
    logger.warn("User-Agent:", { userAgent: req.get('User-Agent') });
    logger.warn("Timestamp:", { timestamp: new Date().toISOString() });
    logger.warn("=== END RATE LIMIT HIT ===");
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    });
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// Static files
app.use('/reports', express.static(path.join(__dirname, '..', 'reports')));

// Log route registration
logger.info("=== REGISTERING ROUTES ===");
logger.info("Auth routes:", { route: '/api/auth' });
logger.info("Attendance routes:", { route: '/api/attendance' });
logger.info("Leave routes:", { route: '/api/leaves' });
logger.info("Manager routes:", { route: '/api/manager' });
logger.info("Report routes:", { route: '/api/reports' });
logger.info("Manager holiday routes:", { route: '/api/manager/holidays' });
logger.info("Public holiday routes:", { route: '/api/holidays' });
logger.info("Birthday routes:", { route: '/api/birthdays' });
logger.info("Branch routes:", { route: '/api/branches' });
logger.info("Jobs routes:", { route: '/jobs' });
logger.info("Health routes:", { route: '/' });
logger.info("=== END REGISTERING ROUTES ===");

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/holidays', publicHolidayRoutes); // Public holiday routes
app.use('/api/birthdays', birthdayRoutes); // Birthday routes
app.use('/api/branches', branchRoutes); // Branch routes

// Add new routes
app.use('/jobs', jobsRoutes);
app.use('/', healthRoutes);

// Global error handler
app.use(globalErrorHandler);

module.exports = app;