const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');

// Import our custom Redis rate limiter
const redisRateLimiter = require('./middleware/redisRateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const managerRoutes = require('./routes/manager');
const reportRoutes = require('./routes/reports');
const holidayRoutes = require('./routes/holidays');
const publicHolidayRoutes = require('./routes/publicHolidays'); // Public holiday routes
const branchesRoutes = require('./routes/branches'); // Branches route
const announcementsRoutes = require('./routes/announcements'); // Announcements route
const cronRoutes = require('./routes/crons'); // Cron job routes

// Initialize app
const app = express();

// Trust proxy - essential for getting real client IPs in proxy environments like Render
app.set('trust proxy', true);

// Log all incoming requests
app.use((req, res, next) => {
  console.log("=== INCOMING REQUEST ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("IP:", req.ip);
  console.log("Real IP:", req.headers['x-forwarded-for'] || req.connection.remoteAddress);
  console.log("User-Agent:", req.get('User-Agent'));
  console.log("Timestamp:", new Date().toISOString());
  console.log("=== END INCOMING REQUEST ===");
  next();
});

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://192.168.18.210:5173',// Network IP
      'http://192.168.18.168:5174', //frontend URL
      process.env.FRONTEND_URL
    ].filter(Boolean); // Filter out undefined values

    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Granular rate limiting based on endpoint sensitivity
// High-security endpoints (login, register, etc.)
const authLimiter = redisRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 attempts per window
  prefix: 'auth_limit',
  message: 'Too many authentication attempts, please try again later.',
  keyGenerator: (req) => {
    // Use IP for authentication endpoints
    let ip = req.ip || req.connection.remoteAddress;

    // Handle X-Forwarded-For header
    if (req.headers['x-forwarded-for']) {
      ip = req.headers['x-forwarded-for'].split(',')[0].trim();
    } else if (req.headers['x-real-ip']) {
      ip = req.headers['x-real-ip'];
    }

    return ip;
  }
});

// Regular endpoints (most API calls)
const apiLimiter = redisRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute per user
  prefix: 'api_limit',
  message: 'Too many requests, please try again later.'
});

// High-volume endpoints (attendance)
const highVolumeLimiter = redisRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute per user
  prefix: 'high_volume_limit',
  message: 'Too many requests, please try again later.'
});

// Apply rate limiters to routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/manager', highVolumeLimiter);
app.use('/api/attendance', highVolumeLimiter);
app.use('/api', apiLimiter); // Catch-all for other API routes

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// Static files - Serve frontend build files
// This should be before API routes but after middleware
app.use(express.static(path.join(__dirname, '..', '..', 'dist')));

// Static files for reports
app.use('/reports', express.static(path.join(__dirname, '..', 'reports')));

// Log route registration
console.log("=== REGISTERING ROUTES ===");
console.log("Auth routes:", '/api/auth');
console.log("Attendance routes:", '/api/attendance');
console.log("Leave routes:", '/api/leaves');
console.log("Manager routes:", '/api/manager');
console.log("Report routes:", '/api/reports');
console.log("Manager holiday routes:", '/api/manager/holidays');
console.log("Public holiday routes:", '/api/holidays');
console.log("Branches routes:", '/api/branches'); // Added branches route
console.log("Announcements routes:", '/api/announcements'); // Added announcements route
console.log("Cron routes:", '/api/crons'); // Added cron routes
console.log("=== END REGISTERING ROUTES ===");

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/holidays', publicHolidayRoutes); // Public holiday routes
app.use('/api/branches', branchesRoutes); // Branches route
app.use('/api/announcements', announcementsRoutes); // Announcements route
app.use('/api/crons', cronRoutes); // Cron job routes

// Health check endpoint
app.get('/health', (req, res) => {
  console.log("=== HEALTH CHECK ===");
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend routes (SPA fallback)
// This should be after API routes but before error handler
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
  
  // Serve the frontend app for all non-API routes
  res.sendFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== ERROR ===');
  console.error('Error:', err);
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('IP:', req.ip);
  console.error('Timestamp:', new Date().toISOString());

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
  console.error('=== END ERROR ===');
});

module.exports = app;