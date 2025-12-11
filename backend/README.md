# SAMS Backend v2.0

This is the backend API for the Geo-Fence Attendance Management System (SAMS) v2.0.

## Features

- **Multi-Branch Attendance System**: Employees can check in from any company branch location
- **Advanced Geofencing**: Precise location validation with distance calculations using Haversine formula
- **Role-Based Access Control**: Secure three-tier hierarchy (Director, Manager, Employee)
- **Comprehensive Leave Management**: Full support for various leave types with approval workflows
- **Robust Reporting Engine**: Detailed attendance reports with CSV/Excel export capabilities
- **Automated Business Processes**: Daily attendance processing and birthday notifications
- **Enhanced Dashboard UI**: Improved Manager/Director interface with role-specific layouts
- **Real-time Notifications**: Telegram/Brevo integration for flagged attendance alerts
- **Admin Analytics**: Company-wide insights and user management
- **Flexible Absent Handling**: Users marked absent can check in later and update their status
- **Enterprise-Grade Security**: JWT authentication with HTTP-only cookies and bcrypt password hashing
- **Enhanced Holiday Management**: Automatic Sunday holidays and custom holiday declarations
- **Birthday Notification System**: Daily birthday alerts with celebration banners
- **Advanced Flagged Attendance**: Detailed reasons with distance reporting
- **Persistent Login Sessions**: "Remember Me" functionality for extended sessions
- **Industrial-Grade Rate Limiting**: Redis-based distributed rate limiting for scalability
- **Distributed Caching**: Redis caching for improved performance
- **Database Connection Pooling**: Optimized database connections for better resource utilization
- **Zero-Cost Deployment**: Compatible with free tiers of Render, Vercel, and MongoDB Atlas

## Tech Stack

- **Node.js with Express.js**: High-performance backend framework
- **MongoDB with Mongoose**: NoSQL database with ODM for data modeling
- **JWT for authentication**: Secure token-based authentication
- **bcrypt for password hashing**: Industry-standard password encryption
- **ExcelJS for report generation**: Professional CSV/Excel report exports
- **node-cron for scheduled jobs**: Automated daily attendance processing
- **Winston for logging**: Comprehensive application logging
- **Redis for Rate Limiting and Caching**: Industrial-grade distributed rate limiting and caching
- **Helmet for security**: HTTP security headers
- **CORS protection**: Cross-origin resource sharing controls
- **Zod for validation**: Schema validation for API requests
- **Rate limiting**: Protection against brute force and DDoS attacks

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Install Redis:
   - **On macOS**: `brew install redis`
   - **On Ubuntu/Debian**: `sudo apt-get install redis-server`
   - **Using Docker**: `docker run -d -p 6379:6379 redis`

3. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env` with your configurations, including Redis settings.

5. Start the development server with Redis:
   ```bash
   npm run start:dev
   ```
   
   Or start services separately:
   ```bash
   # Terminal 1 - Start Redis
   redis-server
   
   # Terminal 2 - Start the application
   npm run dev
   ```

## 🆕 What's New in v2.0

This version introduces significant enhancements and new features:

### Major New Features

- **Multi-Branch Support**: Employees can now check in from any company branch location
- **Enhanced Dashboard API**: Completely redesigned endpoints for Manager/Director dashboard
- **Birthday Notification System**: Automatic birthday alerts with celebration banners
- **Advanced Flagged Attendance**: Detailed reasons with precise distance reporting
- **Industrial-Grade Rate Limiting**: Redis-based distributed rate limiting for scalability
- **Distributed Caching**: Redis caching for improved performance
- **Database Connection Pooling**: Optimized database connections for better resource utilization

### Enhanced Functionality

- **Improved Attendance Rules**: Updated time thresholds and flexible attendance marking
- **Advanced Holiday Management**: Automatic Sunday holidays and custom holiday declarations
- **Detailed Reporting**: Enhanced CSV/Excel reports with branch and distance information
- **Persistent Login Sessions**: "Remember Me" functionality for extended sessions

### Technical Improvements

- **Enhanced Security**: Enterprise-grade authentication and authorization
- **Better Performance**: Optimized queries and caching mechanisms
- **Scalable Architecture**: Ready for horizontal scaling with Redis
- **Zero-Cost Deployment**: Still compatible with free tiers of cloud services

See [New Features Documentation](../DOCS/NEW_FEATURES.md) for detailed information.

## Redis Configuration

The system now supports both legacy and modern Redis configuration approaches:

### Modern Approach (Recommended for Production)
Set a single `REDIS_URL` environment variable:
```bash
REDIS_URL=redis://default:<password>@<host>:<port>
```

For secure connections (Upstash, Redis Cloud, etc.):
```bash
REDIS_URL=rediss://default:<password>@<host>:<port>
REDIS_USE_TLS=true
```

### Legacy Approach (Backward Compatible)
Separate environment variables (will show deprecation warning):
```bash
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Note**: The modern REDIS_URL approach is recommended for production deployments as it's the standard used by all major Redis providers.

## Testing

1. Make sure MongoDB is running or set the `MONGO_URI` environment variable in your `.env` file.

2. Run all tests:
   ```bash
   npm test
   ```

3. Run tests in watch mode:
   ```bash
   npm run test:watch
   ```

4. Test Redis configuration:
   ```bash
   npm run test:redis
   ```

The test files will automatically use the `MONGO_URI` from your `.env` file, or fall back to `mongodb://localhost:27017/test` if not set.

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login (supports rememberMe parameter)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/register` - Create user (admin only)

### Attendance

- `POST /api/attendance/checkin` - Check in with location
- `POST /api/attendance/checkout` - Check out with location
- `GET /api/attendance/me` - Get personal attendance history
- `GET /api/attendance/today` - Get today's attendance status
- `GET /api/attendance/team` - Get team attendance (manager only)
- `GET /api/attendance/flagged` - Get flagged attendance records (manager only)

### Leaves

- `POST /api/leaves` - Create leave request
- `GET /api/leaves/me` - Get personal leave requests
- `DELETE /api/leaves/:id` - Cancel leave request
- `GET /api/leaves/team` - Get team leave requests (manager only)
- `PUT /api/leaves/:id` - Approve/reject leave request (manager only)

### Manager

- `GET /api/manager/team/attendance` - Get team attendance
- `GET /api/manager/team/flagged` - Get flagged records
- `GET /api/manager/team/leaves` - Get team leave requests
- `PUT /api/manager/leaves/:id` - Approve/reject leave request

### Reports

- `POST /api/reports` - Generate report
- `POST /api/reports/preview` - Preview report
- `GET /api/reports/my` - Get personal reports
- `GET /api/reports/:id/download` - Download report

### Holidays

- `POST /api/holidays` - Create holiday (manager only)
- `GET /api/holidays` - Get all holidays
- `DELETE /api/holidays/:id` - Delete holiday (manager only)

### Branches

- `POST /api/branches` - Create branch (admin only)
- `GET /api/branches` - Get all branches
- `PUT /api/branches/:id` - Update branch (admin only)
- `DELETE /api/branches/:id` - Delete branch (admin only)

### Dashboard Enhancements

- `GET /api/manager/dashboard/stats` - Get dashboard statistics for manager/director
- `GET /api/manager/team/members` - Get team members with enhanced profile data
- Enhanced data endpoints with role-specific information for unified Manager/Director interface

## Environment Variables

See `.env.example` for all required environment variables, including Redis configuration.

## New Features Implementation Status

### ✅ Multi-Branch Attendance
- Added Branch model with name, location (lat/lng), radius (default 50m), isActive
- Updated Attendance model with branch reference and distance tracking
- Employees can check in from any branch
- Distance from branch is calculated and stored

### ✅ Attendance Time Rules Update
- Full attendance marking allowed anytime between 12:01 AM and 11:59 PM
- Half-day threshold changed from 4 hours to 5 hours
- Clean attendance between 9 AM to 7 PM unless holiday/Sunday

### ✅ Holiday Management System
- All Sundays automatically treated as holidays
- If employee marks attendance on Sunday, always flagged
- Managers can declare custom holidays via API/UI
- Added isRecurringSunday field to Holiday model

### ✅ Birthday Notification Feature
- Added dob field to User model as Date (indexed for performance)
- Created daily cron job at 8:00 AM to scan for birthdays
- Notifies all employees about birthdays
- Frontend displays birthday banner in dashboard

### ✅ Flagged Attendance Enhancements
- Enhanced flaggedReason with detailed information including distance
- Distance from branch stored in attendance records
- Distance included in CSV/Excel reports and manager dashboard

### ✅ Persistent Login Sessions
- Added "Remember Me" functionality for extended session duration
- Users can choose between 24-hour (default) or 30-day sessions
- Backend supports the rememberMe parameter in login requests
- Cookie expiration time dynamically adjusted based on user preference

### ✅ Industrial-Grade Rate Limiting
- Implemented Redis-based distributed rate limiting
- Per-user rate limiting using JWT user IDs
- Granular limits based on endpoint sensitivity
- Sliding window log algorithm for accuracy

### ✅ Distributed Caching
- Redis-based caching for high-traffic endpoints
- Cache-aside pattern implementation
- Configurable TTL for different data types
- Intelligent cache key generation

### ✅ Enhanced Dashboard API
- Added role-specific endpoints for Manager/Director dashboard
- Improved data aggregation for dashboard statistics
- Enhanced team member data with profile information
- Unified data structure for consistent Manager/Director interface

## Current Achievements

### ✅ Core Functionality
- **Complete User Management**: Directors, managers, and employees with proper role-based access control
- **Multi-Branch Support**: Employees can check in from any company branch with proper geofencing
- **Advanced Attendance Tracking**: Location-based check-in/check-out with distance calculations
- **Comprehensive Leave System**: Full-day, half-day, and partial day leave requests with approval workflows
- **Robust Reporting**: Detailed attendance reports with CSV/Excel export capabilities
- **Automated Processes**: Daily attendance processing, auto-checkout, and birthday notifications

### ✅ Security & Reliability
- **Secure Authentication**: JWT tokens with HTTP-only cookies and bcrypt password hashing
- **Input Validation**: Zod schemas for request validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Whitelist-based cross-origin resource sharing
- **Data Sanitization**: Protection against NoSQL injection attacks

### ✅ Database & Infrastructure
- **Scalable Architecture**: MongoDB with proper indexing for performance
- **Zero-Cost Deployment**: Compatible with free tiers of Render, Vercel, and MongoDB Atlas
- **Comprehensive Testing**: 35+ unit tests covering all new functionality
- **Proper Error Handling**: Graceful error responses with detailed logging
- **Connection Pooling**: Optimized database connections with pooling

### ✅ Recent Database Seeding
Successfully seeded database with:
- **2 Branches**: Old Office (26.913662872166825, 80.95341830268484) and New Office (26.914835918849107, 80.94982919387432)
- **5 Users**: 
  - Director: LIM Rao (LRMC001)
  - Manager: Vikhas Gupta (LRMC002)
  - Employees: Uday Singh (LRMC003), Simhachalam M (LRMC004), Haneef Sd (LRMC005)
- **All Login Tests Passing**: Verified successful authentication for all users

## Future Improvements

### 🚀 Performance Enhancements
- **Background Jobs**: Move heavy processing to background workers
- **Pagination**: Implement pagination for large dataset responses
- **Advanced Caching**: Write-through caching for frequently updated data

### 🛡️ Advanced Security Features
- **Two-Factor Authentication**: Add 2FA support for enhanced security
- **Session Management**: Implement session tracking and invalidation
- **Audit Logging**: Detailed logs for all user actions

### 📊 Enhanced Analytics & Reporting
- **Real-time Dashboards**: Live attendance monitoring with WebSocket updates
- **Advanced Analytics**: Trend analysis, productivity metrics, and predictive modeling
- **Custom Report Builder**: Allow users to create custom reports with drag-and-drop interface
- **Data Visualization**: Interactive charts and graphs for better data interpretation

### 🌐 Mobile & Accessibility Improvements
- **Progressive Web App**: Make the frontend a PWA for mobile device support
- **Offline Support**: Cache critical data for offline functionality
- **Accessibility Compliance**: WCAG 2.1 AA compliance for better accessibility
- **Mobile-First Design**: Optimize UI for mobile devices

### 🔄 Process Automation
- **Intelligent Notifications**: Smart notification system based on user preferences
- **Automated Scheduling**: Automatic shift scheduling based on attendance patterns
- **Integration APIs**: Third-party integrations (payroll systems, HR platforms)
- **Workflow Automation**: Automated approval workflows for leaves and other requests

### 🧪 Advanced Testing & Monitoring
- **End-to-End Testing**: Implement Cypress or Playwright for frontend testing
- **Performance Monitoring**: Add Application Performance Monitoring (APM) tools
- **Error Tracking**: Integrate Sentry or similar error tracking services
- **Load Testing**: Regular load testing to ensure scalability

### 🎨 UI/UX Enhancements
- **Dark Mode**: Implement dark/light theme switching
- **Customizable Dashboard**: Allow users to customize their dashboard layouts
- **Improved User Onboarding**: Guided tours and tooltips for new users
- **Enhanced Data Entry**: Better forms with real-time validation and suggestions

## Deployment Roadmap

### Phase 1: Immediate (Current Status)
- ✅ Core functionality implemented and tested
- ✅ Database properly seeded with sample data
- ✅ All login tests passing
- ✅ Zero-cost deployment ready
- ✅ Industrial-grade rate limiting and caching implemented
- ✅ Enhanced dashboard API endpoints

### Phase 2: Short-term Improvements
- [ ] Add comprehensive error tracking
- [ ] Enhance security with 2FA
- [ ] Improve mobile responsiveness

### Phase 3: Long-term Enhancements
- [ ] Real-time dashboards with WebSocket
- [ ] Advanced analytics and reporting
- [ ] Third-party integrations
- [ ] Workflow automation features

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

MIT License - see LICENSE file for details.