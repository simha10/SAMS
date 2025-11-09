# Geo-Fence Attendance Management System

A production-ready, zero-cost Geo-Fence Attendance Management System for offices with 50-100 employees using React (Vite), Express, and MongoDB Atlas.

## 🚀 Features

- **Geo-fenced Check-in/Check-out**: Location-based attendance with Haversine distance calculation
- **Role-based Access Control**: Employee, Manager, and Director roles with different permissions
- **Real-time Notifications**: Telegram/Brevo integration for flagged attendance alerts
- **Manager Dashboard**: Team attendance overview, flagged records, leave management
- **Admin Analytics**: Company-wide insights, charts, CSV export, user management
- **Automated Jobs**: Daily absentee marking and manager summaries via cron jobs
- **Flexible Absent Handling**: Users marked absent can check in later and update their status
- **Security**: JWT authentication, rate limiting, input validation, CORS protection

## 🏗️ Architecture

### Backend (Express.js + Node.js)

- **Authentication**: JWT tokens in HTTP-only cookies with bcrypt password hashing
- **Database**: MongoDB Atlas with Mongoose ODM
- **Validation**: Zod schemas for request validation
- **Notifications**: Adapter pattern supporting Telegram and Brevo
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Jobs**: Node-cron for automated daily tasks

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
│   │   ├── config/       # Database and logger config
│   │   ├── controllers/  # Route handlers
│   │   ├── routes/       # API routes
│   │   ├── models/       # MongoDB schemas
│   │   ├── middleware/   # Auth and validation middleware
│   │   ├── services/     # Business logic services
│   │   ├── jobs/         # Cron job definitions
│   │   └── utils/        # Utility functions
│   ├── scripts/          # Database initialization
│   ├── __tests__/        # Unit tests
│   └── package.json
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── pages/            # Route components
│   ├── services/         # API client
│   ├── stores/           # Zustand stores
│   ├── hooks/            # Custom React hooks
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

   # Notifications (optional)
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   TELEGRAM_CHAT_ID=your-telegram-chat-id

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

- Location-based check-in/check-out during office hours (9 AM - 8 PM)
- View attendance history and working hours
- Submit leave requests with approval workflow
- **Late Check-in Support**: Users marked absent can check in later and update their status to present or half-day

### Manager Features

- Team attendance overview with daily summaries
- Review flagged attendance records (outside geofence/hours)
- Approve/reject leave requests from team members
- Receive notifications for attendance violations

### Director/Admin Features

- Company-wide analytics with charts and trends
- User management (create, edit, activate/deactivate users)
- Export attendance data to CSV
- Top performers leaderboard

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

#### Notification Failures:

- Verify TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
- Check network connectivity
- Ensure bot has proper permissions

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

## 📄 License

MIT License - see LICENSE file for details.
