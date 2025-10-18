# SAMS Backend

This is the backend API for the Geo-Fence Attendance Management System.

## Features

- User authentication with JWT
- Attendance tracking with geofence validation
- Leave management system
- Report generation (CSV and Excel)
- Role-based access control
- Manager dashboard functionality

## Tech Stack

- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- ExcelJS for report generation

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

### Leaves

- `POST /api/leaves` - Create leave request
- `GET /api/leaves/me` - Get personal leave requests
- `DELETE /api/leaves/:id` - Cancel leave request

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

## Environment Variables

See `.env.example` for all required environment variables.
