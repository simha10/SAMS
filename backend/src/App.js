const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
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
const branchesRoutes = require('./routes/branches'); // Branches route

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

    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://192.168.18.210:5173',// Network IP
      'http://192.168.18.168:5174',
      'https://sams-frontend-sq6o.onrender.com', //frontend URL
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

// Cookie parser
app.use(cookieParser());

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
console.log("Branches routes:", '/api/branches'); // Added branches route
console.log("=== END REGISTERING ROUTES ===");

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/holidays', publicHolidayRoutes); // Public holiday routes
app.use('/api/branches', branchesRoutes); // Branches route

// Health check endpoint
app.get('/health', (req, res) => {
  console.log("=== HEALTH CHECK ===");
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
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

// 404 handler
app.use('*', (req, res) => {
  console.log("=== 404 NOT FOUND ===");
  console.log("URL:", req.url);
  console.log("Method:", req.method);
  console.log("IP:", req.ip);
  console.log("Timestamp:", new Date().toISOString());
  console.log("=== END 404 NOT FOUND ===");

  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;