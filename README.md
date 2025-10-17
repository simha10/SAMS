A production-ready, zero-cost Geo-Fence Attendance Management System for offices with 50-100 employees using React (Vite), Express, and MongoDB Atlas.

🚀 Features
Geo-fenced Check-in/Check-out: Location-based attendance with Haversine distance calculation
Role-based Access Control: Employee, Manager, and Director roles with different permissions
Real-time Notifications: Telegram/Brevo integration for flagged attendance alerts
Manager Dashboard: Team attendance overview, flagged records, leave management
Admin Analytics: Company-wide insights, charts, CSV export, user management
Automated Jobs: Daily absentee marking and manager summaries via cron jobs
Security: JWT authentication, rate limiting, input validation, CORS protection
🏗️ Architecture
Backend (Express.js + Node.js)
Authentication: JWT tokens in HTTP-only cookies with bcrypt password hashing
Database: MongoDB Atlas with Mongoose ODM
Validation: Zod schemas for request validation
Notifications: Adapter pattern supporting Telegram and Brevo
Security: Helmet, CORS, rate limiting, input sanitization
Jobs: Node-cron for automated daily tasks
Frontend (React + Vite + TypeScript)
State Management: Zustand for global state
UI Components: shadcn/ui with Tailwind CSS
Routing: React Router with protected routes
API Client: Axios with interceptors
Geolocation: Native browser geolocation API
Charts: Recharts for analytics visualization
📁 Project Structure
attendance/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── app.js          # Express app configuration
│   │   ├── server.js       # Server entry point
│   │   ├── config/         # Database and logger config
│   │   ├── controllers/    # Route handlers
│   │   ├── routes/         # API routes
│   │   ├── models/         # MongoDB schemas
│   │   ├── middleware/     # Auth and validation middleware
│   │   ├── services/       # Business logic services
│   │   ├── jobs/           # Cron job definitions
│   │   └── utils/          # Utility functions
│   ├── scripts/            # Database initialization
│   ├── __tests__/          # Unit tests
│   └── package.json
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── pages/              # Route components
│   ├── services/           # API client
│   ├── stores/             # Zustand stores
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
└── README.md
🛠️ Installation & Setup
Prerequisites
Node.js 18+
MongoDB Atlas account
Telegram Bot (optional, for notifications)
Backend Setup
Install dependencies:
cd backend
npm install
Environment Configuration:
cp .env.example .env
Edit .env with your configurations:

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gofence-attendance?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
BCRYPT_SALT_ROUNDS=10

# Server
PORT=5000
NODE_ENV=development

# Office Configuration
OFFICE_DEFAULT_LAT=37.7749
OFFICE_DEFAULT_LNG=-122.4194
OFFICE_DEFAULT_RADIUS=100

# Admin Initialization (optional)
ADMIN_INIT_EMAIL=admin@company.com
ADMIN_INIT_PASSWORD=admin123

# Notifications (optional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# CORS
FRONTEND_URL=http://localhost:5173
Initialize Database:
npm run init-db
Start Development Server:
npm run dev
Frontend Setup
Install dependencies:
pnpm install
Environment Configuration: Create .env.local:
VITE_API_URL=http://localhost:5000
Start Development Server:
pnpm run dev
🧪 Testing
Backend Tests
cd backend
npm test
npm run test:watch  # Watch mode
Frontend Build
pnpm run build
pnpm run lint
🚀 Deployment
Backend Deployment (Render)
Create Web Service on Render
Connect GitHub repository
Configure Build & Start Commands:
Build Command: cd backend && npm install
Start Command: cd backend && npm start
Set Environment Variables in Render dashboard
Add Scheduled Job (optional):
Command: cd backend && node -e "require('./src/jobs/daily.js')"
Schedule: 0 11 * * * (11 AM daily)
Frontend Deployment (Vercel)
Connect GitHub repository to Vercel
Configure Build Settings:
Framework Preset: Vite
Build Command: pnpm run build
Output Directory: dist
Set Environment Variables:
VITE_API_URL: Your backend URL (e.g., https://your-app.onrender.com)
Database Setup (MongoDB Atlas)
Create free cluster on MongoDB Atlas
Create database user with read/write permissions
Configure network access (0.0.0.0/0 for development)
Get connection string and update MONGO_URI in environment variables
📱 Usage
Employee Features
Location-based check-in/check-out during office hours (10 AM - 6 PM)
View attendance history and working hours
Submit leave requests with approval workflow
Manager Features
Team attendance overview with daily summaries
Review flagged attendance records (outside geofence/hours)
Approve/reject leave requests from team members
Receive notifications for attendance violations
Director/Admin Features
Company-wide analytics with charts and trends
User management (create, edit, activate/deactivate users)
Export attendance data to CSV
Top performers leaderboard
🔧 Configuration
Office Location
Update office coordinates in environment variables:

OFFICE_DEFAULT_LAT=37.7749      # Office latitude
OFFICE_DEFAULT_LNG=-122.4194    # Office longitude
OFFICE_DEFAULT_RADIUS=100       # Allowed radius in meters
Office Hours
Modify isWithinOfficeHours() function in backend/src/utils/haversine.js:

function isWithinOfficeHours(date = new Date()) {
  const hour = date.getHours();
  return hour >= 10 && hour < 18; // 10 AM to 6 PM
}
Notifications
Configure Telegram bot:

Create bot via @BotFather
Get bot token and chat ID
Update environment variables
🔒 Security Features
JWT Authentication with HTTP-only cookies
Password Hashing with bcrypt
Rate Limiting on authentication endpoints
Input Validation with Zod schemas
CORS Protection with whitelist
Helmet Security Headers
Request Logging with Winston
🚨 Troubleshooting
Common Issues
Location Permission Denied:

Ensure HTTPS in production
Check browser location settings
Verify geolocation API support
Database Connection Failed:

Verify MongoDB Atlas connection string
Check network access whitelist
Ensure database user permissions
CORS Errors:

Update FRONTEND_URL in backend environment
Verify domain whitelist in CORS configuration
Notification Failures:

Check Telegram bot token and chat ID
Verify API rate limits
Review notification service logs
Development Commands
# Backend
npm run dev          # Start development server
npm run lint         # Run ESLint
npm test             # Run tests
npm run init-db      # Initialize database

# Frontend  
npm run dev         # Start development server
npm run build       # Build for production
npm run lint        # Run ESLint
npm run preview     # Preview production build
📊 API Endpoints
Authentication
POST /api/auth/login - User login
POST /api/auth/logout - User logout
POST /api/auth/register - Create user (admin only)
GET /api/auth/profile - Get user profile
Attendance
POST /api/attendance/checkin - Check in with location
POST /api/attendance/checkout - Check out with location
GET /api/attendance/me - Get personal attendance history
GET /api/attendance/today - Get today’s attendance status
Manager
GET /api/manager/team/attendance - Get team attendance
GET /api/manager/team/flagged - Get flagged records
GET /api/manager/team/leaves - Get team leave requests
PUT /api/manager/leaves/:id - Approve/reject leave request
Admin
GET /api/admin/insights - Get company analytics
GET /api/admin/users - Get all users
PUT /api/admin/users/:id - Update user
GET /api/admin/export/attendance - Export attendance CSV
📄 License
MIT License - feel free to use this project for your organization.

🤝 Contributing
Fork the repository
Create feature branch (git checkout -b feature/amazing-feature)
Commit changes (git commit -m 'Add amazing feature')
Push to branch (git push origin feature/amazing-feature)
Open Pull Request
📞 Support
For issues and questions:

Check the troubleshooting section
Review API documentation
Create GitHub issue with detailed description