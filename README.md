# Geo-Fence Attendance Management System

A production-ready, zero-cost Geo-Fence Attendance Management System for offices with 50-100 employees using React (Vite), Express, and MongoDB Atlas.

## 🚀 Features

### Core Features
- **Multi-Branch Geo-Fencing**: Database-driven branch management with location validation across multiple office locations
- **JWT Bearer Token Authentication**: Production-ready access + refresh token authentication with in-memory storage
- **Device Tracking & Session Management**: UUID-based device identification with MongoDB session persistence
- **Unusual Login Detection**: Automatic detection of multi-device logins and suspicious patterns
- **Smart Office Hours**: Attendance window (9 AM - 8 PM) with core hours (10 AM - 6 PM) and overtime tracking
- **Birthday Notifications**: Employee birthday tracking with popup notifications
- **Role-based Access Control**: Employee, Manager, and Director roles with different permissions
- **Real-time Notifications**: Telegram/Brevo integration for flagged attendance alerts
- **Manager Dashboard**: Team attendance overview, flagged records, leave management
- **Admin Analytics**: Company-wide insights, charts, CSV export, user management
- **Automated Jobs**: Daily absentee marking and manager summaries via cron jobs
- **Performance Optimized**: MongoDB best practices with .lean(), projections, and comprehensive indexing

## 🏗️ Architecture

### Backend (Express.js + Node.js)

- **Authentication**: JWT Bearer tokens (access + refresh) with device tracking and session management
- **Database**: MongoDB Atlas with Mongoose ODM, optimized with indexes and caching
- **Multi-Branch System**: Database-driven branch configuration with geospatial queries
- **Unusual Activity Logging**: Comprehensive security monitoring and alerting
- **Validation**: Zod schemas for request validation
- **Notifications**: Adapter pattern supporting Telegram and Brevo
- **Security**: Helmet, CORS, rate limiting, input sanitization, XSS protection
- **Jobs**: Node-cron for automated daily tasks
- **Performance**: Branch caching (15-min TTL), .lean() queries, field projections

### Frontend (React + Vite + TypeScript)

- **State Management**: Zustand for global state with in-memory token storage
- **Security**: No token persistence in localStorage (XSS protection)
- **Device Identification**: UUID-based device tracking with localStorage
- **Auto Token Refresh**: Automatic access token refresh on 401 errors
- **UI Components**: shadcn/ui with Tailwind CSS
- **Routing**: React Router with protected routes
- **API Client**: Axios with Bearer token injection and interceptors
- **Geolocation**: Native browser geolocation API for multi-branch validation
- **Charts**: Recharts for analytics visualization

## 📁 Project Structure

```
attendance/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── app.js        # Express app configuration
│   │   ├── server.js     # Server entry point
│   │   ├── config/       # Database and logger config
│   │   ├── controllers/  # Route handlers (auth, attendance, branch, birthday)
│   │   ├── routes/       # API routes
│   │   ├── models/       # MongoDB schemas (User, Branch, Session, UnusualActionLog, etc.)
│   │   ├── middleware/   # Bearer token auth and validation middleware
│   │   ├── services/     # Business logic services
│   │   ├── jobs/         # Cron job definitions
│   │   └── utils/        # Utility functions (tokenHelper, haversine, etc.)
│   ├── scripts/          # Database scripts (init, seed, clean)
│   ├── __tests__/        # Unit tests
│   └── package.json
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── pages/            # Route components (Login, Dashboard, etc.)
│   ├── services/         # API client with Bearer token injection
│   ├── stores/           # Zustand stores (authStore with in-memory tokens)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities (deviceId generator)
│   ├── types/            # TypeScript definitions
│   └── utils/            # Utility functions
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
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

   # JWT Authentication (Bearer Tokens)
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_ACCESS_EXPIRY=30m              # Access token expiry (15-30 minutes recommended)
   JWT_REFRESH_EXPIRY=7d              # Refresh token expiry (7-30 days)
   BCRYPT_SALT_ROUNDS=10

   # Server
   PORT=5000
   NODE_ENV=development

   # Default Office/Branch Configuration (used for initial setup)
   OFFICE_DEFAULT_LAT=26.913595
   OFFICE_DEFAULT_LNG=80.953481
   OFFICE_DEFAULT_RADIUS=50
   OFFICE_ADDRESS=Main Office Location

   # Admin Initialization (optional)
   ADMIN_INIT_EMAIL=admin@company.com
   ADMIN_INIT_PASSWORD=admin123

   # Notifications (optional)
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   TELEGRAM_CHAT_ID=your-telegram-chat-id

   # CORS
   FRONTEND_URL=http://localhost:5173
   ```

3. **Initialize Database:**

   ```bash
   # Sync all indexes and create default admin/branch
   npm run init-db

   # Seed sample data (users, branches, holidays, attendance)
   npm run seed-data

   # OR do a complete reset (clean + init + seed)
   npm run reset-db
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

### Available NPM Scripts

```bash
# Backend Scripts
npm run dev          # Start dev server with nodemon
npm run start        # Start production server
npm run init-db      # Initialize database with indexes
npm run seed-data    # Seed sample data
npm run clean-db     # Clean database (requires confirmation)
npm run reset-db     # Clean + Init + Seed (full reset)
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

### Frontend Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Environment Configuration:**
   Create `.env.local`:

   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. **Start Development Server:**
   ```bash
   pnpm run dev
   ```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
npm run test:watch  # Watch mode
```

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

- **Multi-Branch Check-in**: Automatic detection of nearest valid branch location
- **Smart Attendance Window**: Check-in/out during 9 AM - 8 PM window
- **Overtime Tracking**: Automatic detection of early arrival (before 10 AM) and late stay (after 6 PM)
- **Birthday Notifications**: See birthday celebrations for colleagues
- View attendance history and working hours
- Submit leave requests with approval workflow
- **Late Check-in Support**: Users marked absent can check in later and update their status
- **Unusual Login Alerts**: Notified when logging in from a different device

### Manager Features

- Team attendance overview with daily summaries
- **Branch-wise Attendance**: View team attendance across different branches
- Review flagged attendance records (outside geofence/hours, unusual patterns)
- Approve/reject leave requests from team members
- Receive notifications for attendance violations
- **Unusual Activity Monitoring**: Track suspicious login and attendance patterns

### Director/Admin Features

- **Branch Management**: Create, edit, and manage multiple office locations
- **Multi-Branch Analytics**: Company-wide insights across all branches
- Company-wide analytics with charts and trends
- User management (create, edit, activate/deactivate users)
- **Birthday Management**: Add and manage employee birthdays
- **Holiday Management**: Configure company holidays
- Export attendance data to CSV
- Top performers leaderboard
- **Unusual Activity Dashboard**: Monitor all security alerts and unusual patterns

## 🔧 Configuration

### Multi-Branch Setup

Branches are now managed through the database. Admins can:

1. **Add New Branch** (via Admin Dashboard or API):
   ```javascript
   POST /api/branches
   {
     "code": "NYC",
     "name": "New York Office",
     "location": {
       "lat": 40.7128,
       "lng": -74.0060,
       "radius": 100
     },
     "address": "123 Main St, New York, NY",
     "metadata": {
       "city": "New York",
       "state": "NY",
       "country": "USA",
       "timezone": "America/New_York"
     }
   }
   ```

2. **Branch Caching**: System automatically caches active branches for 15 minutes to optimize performance

### Office Hours

Two timing windows are enforced:

1. **Attendance Window** (9 AM - 8 PM): Users can check-in/out during this period
2. **Core Office Hours** (10 AM - 6 PM): Used for overtime and late check-in detection

Modify in `backend/src/utils/haversine.js`:

```javascript
// Attendance window: 9 AM - 8 PM
function isWithinAttendanceWindow(date = new Date()) {
  const hour = date.getHours();
  return hour >= 9 && hour < 20;
}

// Core office hours: 10 AM - 6 PM
function isWithinCoreOfficeHours(date = new Date()) {
  const hour = date.getHours();
  return hour >= 10 && hour < 18;
}
```

### JWT Token Configuration

Configure token expiry in environment variables:

```env
JWT_ACCESS_EXPIRY=30m   # 15-30 minutes recommended
JWT_REFRESH_EXPIRY=7d   # 7-30 days recommended
```

### Notifications

Configure Telegram bot:

1. Create bot via @BotFather
2. Get bot token and chat ID
3. Update environment variables

## 🔒 Security Features

### Authentication & Authorization
- **JWT Bearer Tokens**: Access + Refresh token pattern with short-lived access tokens
- **In-Memory Token Storage**: Tokens never stored in localStorage (XSS protection)
- **Device Tracking**: UUID-based device identification for session management
- **Session Management**: MongoDB-based active session tracking per device
- **Automatic Token Refresh**: Seamless token renewal on expiry
- Password Hashing with bcrypt (10 rounds)

### Unusual Activity Detection
- **Multi-Device Login Detection**: Alerts when different users log in from same device
- **Relogin After Logout**: Flags suspicious relogin patterns
- **Geo-fence Violations**: Logs attendance outside valid branch locations
- **Off-hours Attendance**: Tracks check-ins outside allowed time windows
- **Late Check-in/Early Checkout**: Monitors core hour violations

### Infrastructure Security
- Rate Limiting on authentication endpoints
- Input Validation with Zod schemas
- CORS Protection with whitelist
- Helmet Security Headers
- XSS Protection with input sanitization
- Request Logging with Winston
- MongoDB Injection Protection

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

#### Notification Failures:

- Verify TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
- Check network connectivity
- Ensure bot has proper permissions

## 📊 Key Features Explained

### Multi-Branch Geo-Fencing

**How It Works:**
1. System fetches all active branches from database (cached for 15 minutes)
2. On check-in, calculates distance to all branches using Haversine formula
3. Finds nearest valid branch within configured radius
4. Records attendance with branch reference and validation status

**Benefits:**
- Support for unlimited office locations
- Database-driven configuration (no code changes needed)
- Automatic nearest branch detection
- Performance optimized with intelligent caching

### Smart Attendance & Overtime

**Attendance Window:** 9 AM - 8 PM
- Users can check-in/out only during this period
- Violations logged as unusual activity

**Core Office Hours:** 10 AM - 6 PM
- Used to calculate overtime and late arrivals
- **Early Arrival**: Check-in before 10 AM (tracked as overtime)
- **Late Stay**: Check-out after 6 PM (tracked as overtime)
- **Late Check-in**: After 10 AM (flagged but allowed)

**Absent Handling:**
1. **Daily at 11:00 AM**: System marks users without attendance as 'absent'
2. **Late Check-in**: Users can still check in after being marked absent
3. **Status Update**: Absent record updated with actual check-in data
4. **Half-day Logic**: Working hours determine final status (present/half-day)

### Unusual Login Detection

**Detected Scenarios:**
- **Multi-User Device**: Different employees logging in from same device
- **Relogin After Logout**: User logs back in shortly after logout
- **Token Refresh Anomalies**: Suspicious token refresh patterns

**User Experience:**
- Alerts shown on login if unusual activity detected
- Managers/Directors notified of security events
- All events logged for audit trail

### Session Management

**Device-Based Sessions:**
- Each device gets a unique UUID stored in localStorage
- Sessions tracked per user-device combination
- Multiple active sessions per user (different devices)
- Automatic session cleanup on token expiry

**Token Lifecycle:**
1. Login generates access token (30 min) + refresh token (7 days)
2. Access token sent with every API request (Authorization: Bearer)
3. On access token expiry (401), frontend automatically uses refresh token
4. New access token issued, original request retried
5. On refresh token expiry, user must login again

## 📄 License

MIT License - see LICENSE file for details.
