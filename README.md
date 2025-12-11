# Geo-Fence Attendance Management System (SAMS) v2.0

A production-ready, zero-cost Geo-Fence Attendance Management System for offices with 50-100 employees using React (Vite), Express, and MongoDB Atlas.

## 🚀 Features

- **Multi-Branch Attendance**: Employees can check in from any company branch location with precise geofencing
- **Advanced Geofencing**: Location validation with distance calculations using Haversine formula
- **Role-Based Access Control**: Secure three-tier hierarchy (Director, Manager, Employee)
- **Comprehensive Leave Management**: Full support for various leave types with approval workflows
- **Robust Reporting Engine**: Detailed attendance reports with CSV/Excel export capabilities
- **Automated Business Processes**: Daily attendance processing and birthday notifications
- **Enhanced Dashboard UI**: Improved Manager/Director interface with role-specific layouts
- **Real-time Notifications**: Telegram/Brevo integration for flagged attendance alerts
- **Admin Analytics**: Company-wide insights, charts, and user management
- **Flexible Absent Handling**: Users marked absent can check in later and update their status
- **Security**: Enterprise-grade JWT authentication with HTTP-only cookies and bcrypt password hashing
- **Enhanced Holiday Management**: Automatic Sunday holidays and custom holiday declarations
- **Birthday Notifications**: Daily birthday alerts with celebration banners
- **Advanced Flagged Attendance**: Detailed reasons with distance reporting
- **Progressive Web App (PWA)**: Installable on mobile devices with offline support
- **Mobile-First Design**: LinkedIn-style responsive UI optimized for mobile devices
- **Persistent Login Sessions**: "Remember Me" functionality for extended sessions
- **Industrial-Grade Rate Limiting**: Redis-based distributed rate limiting for scalability
- **Distributed Caching**: Redis caching for improved performance
- **Database Connection Pooling**: Optimized database connections for better resource utilization

## 🏗️ Architecture

### Backend (Express.js + Node.js)

- **Authentication**: JWT tokens in HTTP-only cookies with bcrypt password hashing
- **Database**: MongoDB Atlas with Mongoose ODM
- **Validation**: Zod schemas for request validation
- **Notifications**: Adapter pattern supporting Telegram and Brevo
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Jobs**: Node-cron for automated daily tasks
- **Logging**: Winston for comprehensive logging

### Frontend (React + Vite + TypeScript)

- **State Management**: Zustand for global state
- **UI Components**: shadcn/ui with Tailwind CSS
- **Routing**: React Router with protected routes
- **API Client**: Axios with interceptors
- **Geolocation**: Native browser geolocation API
- **Charts**: Recharts for analytics visualization

## 📁 Project Structure

```
attendance/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── app.js        # Express app configuration
│   │   ├── server.js     # Server entry point
│   │   ├── config/       # Database, logger, and Redis config
│   │   ├── controllers/  # Route handlers
│   │   ├── routes/       # API routes
│   │   ├── models/       # MongoDB schemas
│   │   ├── middleware/   # Auth and validation middleware
│   │   ├── services/     # Business logic services
│   │   ├── jobs/         # Cron job definitions
│   │   ├── utils/        # Utility functions
│   │   └── scripts/      # Database initialization scripts
│   ├── tests/            # Unit tests
│   └── package.json
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── pages/            # Route components
│   ├── services/         # API client
│   ├── stores/           # Zustand stores
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Utility functions
│   ├── layouts/          # Layout components
│   └── lib/              # Shared library functions
├── DOCS/                 # Documentation files
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Redis server (for rate limiting and caching)
- Telegram Bot (optional, for notifications)

### Backend Setup

1. **Install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration:**

   ```bash
   cp .env.example .env
   ```

   Edit .env with your configurations:

   ```env
   # Database
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gofence-attendance?retryWrites=true&w=majority

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   BCRYPT_SALT_ROUNDS=10

   # Server
   PORT=5000
   NODE_ENV=development

   # Office Configuration
   OFFICE_DEFAULT_LAT=26.913595
   OFFICE_DEFAULT_LNG=80.953481
   OFFICE_DEFAULT_RADIUS=50

   # Admin Initialization (optional)
   ADMIN_INIT_EMAIL=admin@company.com
   ADMIN_INIT_PASSWORD=admin123

   # Redis Configuration (Required for rate limiting)
   REDIS_URL=redis://localhost:6379

   # CORS
   FRONTEND_URL=http://localhost:5173
   ```

3. **Initialize Database:**

   ```bash
   npm run init-db
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Environment Configuration:**
   Create `.env.local`:

   ```env
   VITE_API_URL=http://localhost:8080
   VITE_OFFICE_LAT=26.913595
   VITE_OFFICE_LNG=80.953481
   VITE_OFFICE_RADIUS=50
   ```

3. **Start Development Server:**
   ```bash
   pnpm run dev
   ```

## 🔄 Multi-Branch Migration (Production Systems)

This system has been migrated from a single-office geofencing model to a multi-branch system. For production systems with existing data:

### Migration Process

1. **Assessment**: The system automatically detects existing user data with `officeLocation` fields
2. **Branch Creation**: Automatically creates branches from existing user location data
3. **Data Preservation**: All existing data is preserved during migration
4. **System Transition**: The system operates in dual-mode, supporting both legacy and new approaches

### Running Migration

```bash
cd backend
node scripts/migrate-users.js
```

### Verification

```bash
cd backend
node scripts/verify-migration.js
```

### Benefits

- Zero downtime migration
- No data loss
- Backward compatibility maintained
- Rollback capability available

See [Migration Guide](DOCS/MIGRATION_GUIDE.md) for detailed information.

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
npm run test:watch  # Watch mode
```

## 🆕 What's New in v2.0

This version introduces significant enhancements and new features:

### Major New Features

- **Multi-Branch Support**: Employees can now check in from any company branch location
- **Enhanced Dashboard UI**: Completely redesigned Manager/Director dashboard with role-specific layouts
- **Birthday Notification System**: Automatic birthday alerts with celebration banners
- **Advanced Flagged Attendance**: Detailed reasons with precise distance reporting
- **Industrial-Grade Rate Limiting**: Redis-based distributed rate limiting for scalability
- **Distributed Caching**: Redis caching for improved performance
- **Database Connection Pooling**: Optimized database connections for better resource utilization

### Enhanced Functionality

- **Improved Attendance Rules**: Updated time thresholds and flexible attendance marking
- **Advanced Holiday Management**: Automatic Sunday holidays and custom holiday declarations
- **Detailed Reporting**: Enhanced CSV/Excel reports with branch and distance information
- **Better Mobile Experience**: Improved responsive design for all devices
- **Persistent Login Sessions**: "Remember Me" functionality for extended sessions

### Technical Improvements

- **Enhanced Security**: Enterprise-grade authentication and authorization
- **Better Performance**: Optimized queries and caching mechanisms
- **Scalable Architecture**: Ready for horizontal scaling with Redis
- **Zero-Cost Deployment**: Still compatible with free tiers of cloud services

See [New Features Documentation](DOCS/NEW_FEATURES.md) for detailed information.

### Frontend Build

```bash
pnpm run build
pnpm run lint
```

## 🚀 Deployment

### Backend Deployment (Render)

1. Create Web Service on Render
2. Connect GitHub repository
3. Configure Build & Start Commands:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
4. Set Environment Variables in Render dashboard
5. Add Scheduled Job (optional):
   - Command: `cd backend && node -e "require('./src/jobs/daily.js')"`
   - Schedule: `0 11 * * *` (11 AM daily)

### Frontend Deployment (Vercel)

1. Connect GitHub repository to Vercel
2. Configure Build Settings:
   - Framework Preset: Vite
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
3. Set Environment Variables:
   - `VITE_API_URL`: Your backend URL (e.g., https://your-app.onrender.com)

## Database Setup (MongoDB Atlas)

1. Create free cluster on MongoDB Atlas
2. Create database user with read/write permissions
3. Configure network access (0.0.0.0/0 for development)
4. Get connection string and update MONGO_URI in environment variables

## 📱 Usage

### Employee Features

- Location-based check-in/check-out during office hours (9 AM - 8 PM)
- View attendance history and working hours
- Submit leave requests with approval workflow
- **Late Check-in Support**: Users marked absent can check in later and update their status to present or half-day
- **Multi-Branch Check-in**: Check in from any company branch location
- **Birthday Notifications**: Receive birthday alerts for team members

### Manager Features

- Team attendance overview with daily summaries
- Review flagged attendance records (outside geofence/hours)
- Approve/reject leave requests from team members
- Receive notifications for attendance violations
- Declare holidays and manage branch locations
- View detailed flagged attendance with distance information
- **Enhanced Dashboard**: Role-specific dashboard with improved UI/UX

### Director/Admin Features

- Company-wide analytics with charts and trends
- User management (create, edit, activate/deactivate users)
- Export attendance data to CSV
- Top performers leaderboard
- Manage branches and holidays
- **Unified Interface**: Directors share the same dashboard as managers with role-specific labeling

## 📱 Mobile App Features

### Progressive Web App (PWA)

The application can be installed as a Progressive Web App on any modern device:

1. Open the application in Chrome, Edge, Safari, or Firefox
2. Look for the install prompt at the top of the screen
3. Click "Install" to add to your home screen
4. Launch like a native app with full offline capabilities

Benefits of the PWA:
- Works offline for basic functionality
- Loads instantly even on slow networks
- Sends push notifications for important updates
- Takes minimal device storage
- Always up-to-date with latest features

### Mobile-First Design

- **LinkedIn-Style UI**: Modern interface with intuitive navigation
- **Touch Optimized**: Gestures and touch-friendly controls
- **Responsive Layout**: Adapts to all screen sizes
- **Bottom Navigation**: Easy access to key features on mobile
- **Quick Actions**: One-tap check-in/check-out functionality

### Persistent Login Sessions

The application now supports persistent login sessions through the "Remember Me" functionality:

- Users can choose to stay logged in for extended periods (up to 30 days)
- Session duration is configurable (24 hours by default, 30 days with "Remember Me")
- Secure JWT tokens stored in HTTP-only cookies
- Automatic re-authentication without requiring password entry
- Perfect for mobile users who access the application frequently

## 🔧 Configuration

### Office Location

Update office coordinates in environment variables:

```env
OFFICE_DEFAULT_LAT=26.913595  # Office latitude
OFFICE_DEFAULT_LNG=80.953481  # Office longitude
OFFICE_DEFAULT_RADIUS=50      # Allowed radius in meters
```

### Office Hours

Modify `isWithinOfficeHours()` function in `backend/src/utils/haversine.js`:

```javascript
function isWithinOfficeHours(date = new Date()) {
  const hour = date.getHours();
  return hour >= 9 && hour < 20; // 9 AM to 8 PM
}
```

### Notifications

Configure Telegram bot:

1. Create bot via @BotFather
2. Get bot token and chat ID
3. Update environment variables

## 🔒 Security Features

- JWT Authentication with HTTP-only cookies
- Password Hashing with bcrypt
- Rate Limiting on authentication endpoints
- Input Validation with Zod schemas
- CORS Protection with whitelist
- Helmet Security Headers
- Request Logging with Winston

## 🚨 Troubleshooting

### Common Issues

#### Location Permission Denied:

- Ensure HTTPS in production
- Check browser location settings
- Verify geolocation API support

#### Database Connection Failed:

- Verify MongoDB Atlas connection string
- Check network access whitelist
- Ensure database user permissions

#### CORS Errors:

- Update FRONTEND_URL in backend environment
- Verify domain whitelist in CORS configuration


## 📋 Absent Handling Feature

### How It Works

1. **Daily at 11:00 AM**: System automatically marks users without attendance records as 'absent'
2. **Late Check-in**: Users can check in anytime during the day, even after being marked absent
3. **Status Update**: System updates the existing 'absent' record with new check-in data
4. **Checkout Processing**: Working hours are calculated to determine if it's a full day or half day

### Benefits

- **Flexibility**: Users can check in anytime during the day
- **Accuracy**: Properly tracks half-day attendance for users who come in late
- **Data Integrity**: Maintains accurate attendance records
- **Backward Compatibility**: Doesn't affect existing functionality

### Implementation Details

- Modified check-in logic in `backend/src/controllers/attendanceController.js`
- Enhanced checkout logic to properly calculate half-day status
- Migration script to fix any existing records (`backend/scripts/fix-absent-attendance.js`)
- See `SOLUTION.md` for complete technical details

## 🆕 New Features Implementation Status

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
- Added isRecurringSunday field to Holiday model for recurring Sunday holidays

### ✅ Birthday Notification Feature
- Added dob field to User model as Date (indexed for performance)
- Created daily cron job at 8:00 AM to scan for birthdays and notify all employees
- Frontend displays birthday banner in dashboard

### ✅ Flagged Attendance Enhancements
- Enhanced flaggedReason with detailed information including distance
- Distance from branch is stored in attendance records
- Distance is included in CSV/Excel reports and manager dashboard

### ✅ Enhanced Dashboard UI
- Improved Manager/Director dashboard header layout with proper spacing and alignment
- Role-specific dashboard titles displayed on individual pages
- Responsive design improvements for mobile devices
- Unified header layout for consistent user experience

## 🏆 Current Achievements

### ✅ Core Functionality
- **Complete Multi-Branch System**: Employees can check in from any company branch with proper geofencing
- **Advanced Attendance Tracking**: Location-based check-in/check-out with precise distance calculations
- **Comprehensive Leave Management**: Full-day, half-day, and partial day leave requests with approval workflows
- **Robust Reporting Engine**: Detailed attendance reports with CSV/Excel export capabilities
- **Automated Business Processes**: Daily attendance processing, auto-checkout, and birthday notifications

### ✅ Security & Reliability
- **Enterprise-Grade Authentication**: JWT tokens with HTTP-only cookies and bcrypt password hashing
- **Comprehensive Input Validation**: Zod schemas for request validation preventing injection attacks
- **Rate Limiting Protection**: Defense against brute force and DDoS attacks
- **CORS Security**: Whitelist-based cross-origin resource sharing protection
- **Data Sanitization**: Protection against NoSQL injection and XSS attacks

### ✅ Database & Infrastructure
- **Highly Scalable Architecture**: MongoDB with proper indexing for optimal performance
- **Zero-Cost Deployment Ready**: Compatible with free tiers of Render, Vercel, and MongoDB Atlas
- **Extensive Test Coverage**: 35+ unit tests covering all new functionality with environment variable support
- **Professional Error Handling**: Graceful error responses with detailed Winston logging

### ✅ Recent Database Population
Successfully populated database with:
- **2 Branches**: 
  - Old Office at coordinates (26.913662872166825, 80.95351830268484)
  - New Office at coordinates (26.914835918849107, 80.94982919387432)
- **5 Users with Proper Hierarchy**: 
  - Director: LIM Rao (LRMC001)
  - Manager: Vikhas Gupta (LRMC002) reporting to Director
  - Employees: Uday Singh (LRMC003), Simhachalam M (LRMC004), Haneef Sd (LRMC005) reporting to Manager
- **All Users with Complete Profiles**: Including DOB, office locations, and proper role assignments
- **Verified Login Functionality**: All users can successfully authenticate with their credentials

## 🚀 Future Improvements

### 🚀 Performance Enhancements
- **Caching Layer**: Implement Redis for frequently accessed data (user profiles, branch information)
- **Database Optimization**: Add compound indexes for complex queries and pagination
- **Background Processing**: Move heavy operations to background workers for better responsiveness
- **API Response Optimization**: Implement GraphQL or response compression for large datasets

### 🛡️ Advanced Security Features
- **Two-Factor Authentication**: Add 2FA support using TOTP or SMS for enhanced security
- **Session Management**: Implement session tracking, invalidation, and concurrent session limits
- **Audit Trail**: Comprehensive logs for all user actions with change tracking
- **Endpoint-Specific Rate Limiting**: Granular rate limiting based on endpoint sensitivity and user roles

### 📊 Enhanced Analytics & Reporting
- **Real-time Dashboards**: Live attendance monitoring with WebSocket updates and streaming data
- **Predictive Analytics**: Trend analysis, productivity forecasting, and anomaly detection
- **Custom Report Builder**: Drag-and-drop interface for creating custom reports with filters
- **Interactive Data Visualization**: Advanced charts, heatmaps, and drill-down capabilities

### 🌐 Mobile & Accessibility Improvements
- **Progressive Web App**: Full PWA support with offline capabilities and mobile installation
- **Native Mobile Apps**: iOS and Android applications for enhanced mobile experience
- **WCAG 2.1 AA Compliance**: Full accessibility compliance for users with disabilities
- **Responsive Design**: Optimized UI for all device sizes from mobile to large desktop displays

### 🔄 Process Automation
- **Smart Notifications**: AI-powered notification system based on user preferences and behavior
- **Automated Scheduling**: Intelligent shift scheduling based on attendance patterns and business rules
- **Third-Party Integrations**: APIs for payroll systems, HR platforms, and enterprise software
- **Workflow Automation**: Automated approval workflows with escalation policies and reminders

### 🧪 Advanced Testing & Monitoring
- **End-to-End Testing**: Cypress or Playwright implementation for comprehensive frontend testing
- **Performance Monitoring**: Application Performance Monitoring (APM) with real-user monitoring
- **Error Tracking**: Sentry or similar services for proactive error detection and resolution
- **Load & Stress Testing**: Regular performance testing to ensure scalability under load

### 🎨 UI/UX Enhancements
- **Dark/Light Theme**: User-selectable themes with system preference detection
- **Dashboard Customization**: Drag-and-drop widgets for personalized dashboard layouts
- **Enhanced Onboarding**: Interactive tutorials and contextual help for new users
- **Advanced Forms**: Real-time validation, auto-complete, and intelligent data entry assistance

## 🗺️ Development Roadmap

### Phase 1: Immediate Stability (Current Status)
- ✅ Core functionality implemented and thoroughly tested
- ✅ Database properly seeded with realistic sample data
- ✅ All authentication and authorization working correctly
- ✅ Zero-cost deployment configuration verified
- ✅ PWA implementation with mobile-first design
- ✅ Enhanced dashboard UI with improved layout and responsiveness

### Phase 2: Short-term Enhancements (Next 2-3 Months)
- [ ] Implement Redis caching layer for improved performance
- [ ] Add comprehensive error tracking with Sentry integration
- [ ] Enhance security with optional Two-Factor Authentication
- [ ] Improve mobile responsiveness and add PWA capabilities

### Phase 3: Advanced Features (3-6 Months)
- [ ] Real-time dashboards with WebSocket streaming updates
- [ ] Advanced analytics engine with predictive modeling
- [ ] Third-party integration APIs for payroll and HR systems
- [ ] Workflow automation engine for business processes

### Phase 4: Enterprise Features (6+ Months)
- [ ] Native mobile applications for iOS and Android
- [ ] Advanced reporting with custom report builder
- [ ] Machine learning-based attendance pattern analysis
- [ ] Multi-tenant architecture for serving multiple organizations

## 🤝 Contributing

We welcome contributions from the community! Please read our contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 🎉 Conclusion

SAMS v2.0 represents a significant leap forward in attendance management technology. With its multi-branch support, enhanced security features, and industrial-grade scalability, it's ready to serve organizations of all sizes. The system maintains its zero-cost deployment model while delivering enterprise-level functionality.

Key highlights of this release:
- **Multi-Branch Attendance System** for flexible workplace arrangements
- **Enhanced Dashboard UI** with improved user experience
- **Birthday Notification System** for better team engagement
- **Industrial-Grade Rate Limiting** for improved security and scalability
- **Distributed Caching** for better performance
- **Zero-Cost Deployment** maintaining compatibility with free cloud tiers

The system has been thoroughly tested with 35+ unit tests and is production-ready. Future enhancements are planned in our roadmap, focusing on real-time dashboards, advanced analytics, and third-party integrations.

## 📄 License

MIT License - see LICENSE file for details.