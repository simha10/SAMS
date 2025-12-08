# SAMS Setup Guide

This guide explains how to set up and run the complete Geo-Fence Attendance Management System.

## Prerequisites

- Node.js 18+
- MongoDB Atlas account
- pnpm (package manager)
- Telegram Bot (optional, for notifications)

## Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env` with your configurations:
   - MongoDB connection string
   - JWT secret
   - Office coordinates
   - Telegram bot token (optional)

5. Initialize the database (optional):

   ```bash
   npm run init-db
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Frontend Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a `.env.local` file with the following content:

   ```bash
   VITE_API_URL=http://localhost:5000
   VITE_OFFICE_LAT=26.913595
   VITE_OFFICE_LNG=80.953481
   VITE_OFFICE_RADIUS=50
   ```

3. Start the development server:
   ```bash
   pnpm run dev
   ```

## Environment Variables

### Backend (.env)

```bash
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

### Frontend (.env.local)

```bash
VITE_API_URL=http://localhost:5000
VITE_OFFICE_LAT=26.913595
VITE_OFFICE_LNG=80.953481
VITE_OFFICE_RADIUS=50
```

## Default Users

After running `npm run init-db`, the following users will be created:

1. **Admin User**

   - Employee ID: ADMIN001
   - Email: admin@company.com
   - Password: admin123
   - Role: Director

2. **Manager User**

   - Employee ID: MGR001
   - Email: manager@company.com
   - Password: manager123
   - Role: Manager

3. **Employee User**
   - Employee ID: EMP001
   - Email: employee@company.com
   - Password: employee123
   - Role: Employee

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
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

- `POST /api/branches` - Create branch (director only)
- `GET /api/branches` - Get all branches
- `PUT /api/branches/:id` - Update branch (director only)
- `DELETE /api/branches/:id` - Delete branch (director only)

## Testing

### Backend Tests

```bash
cd backend
npm test
npm run test:watch  # Watch mode
```

### Frontend Tests

```bash
pnpm run test
```

## Building for Production

### Backend

```bash
cd backend
npm run build
```

### Frontend

```bash
pnpm run build
```

## Deployment

### Backend (Render)

1. Create Web Service on Render
2. Connect GitHub repository
3. Configure Build & Start Commands:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
4. Set Environment Variables in Render dashboard

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Configure Build Settings:
   - Framework Preset: Vite
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
3. Set Environment Variables:
   - `VITE_API_URL`: Your backend URL (e.g., https://your-app.onrender.com)

## Troubleshooting

### Common Issues

1. **Location Permission Denied**

   - Ensure HTTPS in production
   - Check browser location settings
   - Verify geolocation API support

2. **Database Connection Failed**

   - Verify MongoDB Atlas connection string
   - Check network access whitelist
   - Ensure database user permissions

3. **CORS Errors**

   - Update FRONTEND_URL in backend environment
   - Verify domain whitelist in CORS configuration

4. **Notification Failures**
   - Check Telegram bot token and chat ID
   - Verify API rate limits
   - Review notification service logs

## Features Overview

### Attendance Tracking

- Location-based check-in/check-out using browser geolocation
- Haversine distance calculation for geofence validation
- Automatic half-day marking based on working hours (5-hour threshold)
- Outside-duty tracking for employees working outside office hours
- Multi-branch support with distance tracking
- Enhanced flagged attendance with detailed reasons

### Leave Management

- Full-day and half-day leave requests
- Morning/afternoon half-day options
- Partial day leave support (half-day start/end dates)
- Proper calculation of leave days including half-days

### Reporting

- Attendance reports with daily status markers
- Summary reports with attendance statistics
- Leave reports with detailed leave information
- Combined reports with all data in a single Excel file
- Report preview functionality
- Detailed attendance reports with branch and distance information

### Role-Based Access

- **Employees**: Check-in/out, view history, apply for leave, multi-branch check-in
- **Managers**: Team attendance overview, approve/reject leaves, view flagged records, manage holidays and branches
- **Directors**: Company-wide analytics, user management, CSV/Excel export, branch management

### Security Features

- JWT authentication with HTTP-only cookies
- Password hashing with bcrypt
- Rate limiting on authentication endpoints
- Input validation with Zod schemas
- CORS protection with whitelist
- Helmet security headers

### New Features

#### Multi-Branch Attendance
- Employees can check in from any company branch
- Branch management via admin dashboard
- Distance tracking from branch location
- Branch-specific geofence validation

#### Enhanced Holiday Management
- Automatic Sunday holidays
- Recurring Sunday support
- Manager-declared holidays
- Holiday flagging for Sunday attendance

#### Birthday Notifications
- Daily birthday scanning at 8:00 AM
- Team-wide birthday notifications
- Dashboard birthday banners
- User date of birth management

## 🎯 Current Achievements

### ✅ Core System Functionality
- **Complete Multi-Branch Implementation**: Fully functional system supporting multiple office locations
- **Advanced Geofencing**: Precise location validation with distance calculations to nearest branch
- **Role-Based Access Control**: Secure hierarchy with Director, Manager, and Employee roles
- **Comprehensive Leave Management**: Flexible leave system supporting various leave types
- **Robust Reporting Engine**: Detailed attendance reports with export capabilities

### ✅ Recent Database Population
Successfully populated database with:
- **2 Branches**: Old Office and New Office with precise coordinates
- **5 Users**: Complete organizational hierarchy with Director, Manager, and 3 Employees
- **All Users Verified**: Confirmed successful login for all created users
- **Realistic Sample Data**: Meaningful test data for demonstration purposes

### ✅ System Verification
- **Authentication Testing**: All users can successfully log in with correct credentials
- **Authorization Testing**: Role-based access properly enforced
- **API Endpoint Validation**: All new endpoints functioning correctly
- **Database Integrity**: Proper relationships and data consistency maintained

## 🚀 Future Improvements

### Short-term Goals (Next 2-3 Months)
- [ ] Implement Redis caching for improved performance
- [ ] Add comprehensive error tracking and monitoring
- [ ] Enhance security with optional Two-Factor Authentication
- [ ] Improve mobile responsiveness and add PWA capabilities

### Medium-term Goals (3-6 Months)
- [ ] Real-time dashboards with WebSocket streaming updates
- [ ] Advanced analytics engine with predictive modeling
- [ ] Third-party integration APIs for payroll and HR systems
- [ ] Workflow automation engine for business processes

### Long-term Goals (6+ Months)
- [ ] Native mobile applications for iOS and Android
- [ ] Advanced reporting with custom report builder
- [ ] Machine learning-based attendance pattern analysis
- [ ] Multi-tenant architecture for serving multiple organizations

## 🛠️ Maintenance Scripts

### Fix Flagged Attendance Records

If attendance records were incorrectly flagged due to geofence validation issues, you can use the fix script:

```bash
# Navigate to backend directory
cd backend

# Fix all incorrectly flagged attendance records
node scripts/fix-flagged-attendance.js

# Fix flagged records for a specific employee
node scripts/fix-flagged-attendance.js EMP123
```

This script will:

- Find attendance records flagged for geofence issues
- Update their status from 'outside-duty' to 'present'
- Clear the flagged status and reason
- Provide a summary of attendance status counts