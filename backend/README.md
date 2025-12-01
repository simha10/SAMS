# SAMS Backend

This is the backend API for the Geo-Fence Attendance Management System.

## Features

- User authentication with JWT
- Attendance tracking with geofence validation
- Leave management system
- Report generation (CSV and Excel)
- Role-based access control
- Manager dashboard functionality
- Multi-Branch Attendance Support
- Enhanced Attendance Time Rules (5-hour threshold)
- Holiday Management with Recurring Sundays
- Birthday Notification System
- Advanced Flagged Attendance with Distance Reporting
- Persistent Login Sessions with "Remember Me" Functionality

## Tech Stack

- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- ExcelJS for report generation
- node-cron for scheduled jobs
- Winston for logging

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

3. Update the environment variables in `.env` with your configurations.

4. Start the development server:
   ```bash
   npm run dev
   ```

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

## Environment Variables

See `.env.example` for all required environment variables.

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

### ✅ Holiday Rules
- All Sundays are holidays
- If employee marks attendance on Sunday, always flagged
- Managers can declare monthly holidays via API/UI
- Added isRecurringSunday field to Holiday model

### ✅ Birthday Notification Feature
- Added dob field to User model as Date (indexed for performance)
- Created daily cron job at 8:00 AM to scan for birthdays and notify all employees
- Frontend displays birthday banner in dashboard

### ✅ Flagged Attendance Enhancements
- Enhanced flaggedReason with detailed information including distance
- Distance from branch is stored in attendance records
- Distance is included in CSV/Excel reports and manager dashboard

### ✅ Persistent Login Sessions
- Added "Remember Me" functionality for extended session duration
- Users can choose between 24-hour (default) or 30-day sessions
- Backend supports the rememberMe parameter in login requests
- Cookie expiration time dynamically adjusted based on user preference

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

### ✅ Recent Database Seeding
Successfully seeded database with:
- **2 Branches**: Old Office (26.913662872166825, 80.95351830268484) and New Office (26.914835918849107, 80.94982919387432)
- **5 Users**: 
  - Director: LIM Rao (LRMC001)
  - Manager: Vikhas Gupta (LRMC002)
  - Employees: Uday Singh (LRMC003), Simhachalam M (LRMC004), Haneef Sd (LRMC005)
- **All Login Tests Passing**: Verified successful authentication for all users

## Future Improvements

### 🚀 Performance Enhancements
- **Caching Layer**: Implement Redis for frequently accessed data (user profiles, branch information)
- **Database Optimization**: Add compound indexes for complex queries
- **Pagination**: Implement pagination for large dataset responses
- **Background Jobs**: Move heavy processing to background workers

### 🛡️ Advanced Security Features
- **Two-Factor Authentication**: Add 2FA support for enhanced security
- **Session Management**: Implement session tracking and invalidation
- **Audit Logging**: Detailed logs for all user actions
- **Rate Limiting Per Endpoint**: More granular rate limiting based on endpoint sensitivity

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

### Phase 2: Short-term Improvements
- [ ] Implement caching layer for performance
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