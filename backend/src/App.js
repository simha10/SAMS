const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');

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
app.use((req, res, next) => {
  console.log("=== INCOMING REQUEST ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("IP:", req.ip);
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
    console.log("=== RATE LIMIT HIT ===");
    console.log("IP:", req.ip);
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("User-Agent:", req.get('User-Agent'));
    console.log("Timestamp:", new Date().toISOString());
    console.log("=== END RATE LIMIT HIT ===");
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

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// Static files
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
console.log("Birthday routes:", '/api/birthdays');
console.log("Branch routes:", '/api/branches');
console.log("Jobs routes:", '/jobs');
console.log("Health routes:", '/');
console.log("=== END REGISTERING ROUTES ===");

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