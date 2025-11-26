# SAMS Backend - Production Ready

## Project Overview

SAMS (Staff Attendance Management System) is a comprehensive geo-fencing attendance solution built with the MERN stack. This backend provides RESTful APIs for employee attendance tracking, leave management, reporting, and administrative functions.

## Architecture

```
Frontend (React) → Cloud Run (Node.js) → MongoDB Atlas → Cloud Scheduler
```

### Key Components:
- **Authentication**: JWT-based access & refresh tokens with "Remember Me" functionality
- **Attendance**: Geo-fencing with location validation and automatic check-in/out
- **Leave Management**: Employee leave requests with manager approval workflow
- **Reporting**: Real-time analytics and exportable reports
- **Notifications**: Automated alerts and summaries
- **Security**: Role-based access control (RBAC) with multi-level permissions

## Folder Structure

```
backend/
├── src/
│   ├── controllers/     # Business logic handlers
│   ├── middleware/      # Authentication, validation, etc.
│   ├── models/          # Mongoose data models
│   ├── routes/          # API route definitions
│   ├── utils/           # Helper functions and utilities
│   ├── jobs/            # Scheduled job logic
│   ├── services/        # External service integrations
│   ├── App.js           # Express app configuration
│   └── server.js        # Application entry point
├── tests/               # Unit and integration tests
├── scripts/             # Database initialization scripts
├── Dockerfile           # Production Docker configuration
└── package.json         # Dependencies and scripts
```

## Authentication Flow

### 1. Login Process
```
[Client] --(empId, password, rememberMe)--> [Auth Controller]
[Auth Controller] --(validate credentials)--> [Database]
[Database] --(user data)--> [Auth Controller]
[Auth Controller] --(generate tokens)--> [Client]
```

### 2. Token System
- **Access Token**: Short-lived (30 minutes), used for API authentication
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens
- **Remember Me**: Stores refresh token in HTTP-only secure cookie

### 3. Token Refresh
```
[Client] --(expired access token)--> [API Interceptor]
[API Interceptor] --(refresh token)--> [Refresh Endpoint]
[Refresh Endpoint] --(new access token)--> [Client]
```

## Deployment Steps

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with required variables
4. Start MongoDB locally or use MongoDB Atlas
5. Run development server: `npm run dev`

### Production Deployment (Cloud Run)

#### Prerequisites:
- Google Cloud Project with billing enabled
- MongoDB Atlas cluster
- GCP Secret Manager setup

#### Steps:
1. **Build Docker Image**:
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/sams-backend
   ```

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy sams-backend \
     --image gcr.io/[PROJECT-ID]/sams-backend \
     --platform managed \
     --region [REGION] \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production
   ```

3. **Configure Secrets in Secret Manager**:
   - Create `sams-mongodb-uri` secret with MongoDB connection string
   - Create `sams-jwt-secret` secret with JWT signing key

4. **Set Environment Variables**:
   ```bash
   gcloud run services update sams-backend \
     --update-env-vars USE_SECRET_MANAGER=true \
     --update-env-vars GOOGLE_CLOUD_PROJECT=[PROJECT-ID] \
     --update-env-vars FRONTEND_URL=[FRONTEND-URL]
   ```

5. **Configure Cloud Scheduler Jobs**:
   - Daily Absentees: `0 11 * * *` (11:00 AM daily)
   - Daily Summary: `30 18 * * *` (6:30 PM daily)
   - Auto Checkout: `0 21 * * *` (9:00 PM daily)

## Environment Variables

### Required Variables:
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-key` |
| `FRONTEND_URL` | Frontend application URL | `https://app.example.com` |

### Optional Variables:
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `8080` |
| `USE_SECRET_MANAGER` | Use GCP Secret Manager | `false` |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID | - |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `30m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `ALLOWED_ORIGINS` | CORS allowed origins | - |

## Security Measures

### 1. Authentication Security
- **JWT Tokens**: Cryptographically signed with HS256
- **HTTP-only Cookies**: Secure storage for refresh tokens
- **Device Tracking**: Session binding to prevent token reuse
- **Rate Limiting**: Prevent brute force attacks

### 2. Data Security
- **Password Hashing**: bcryptjs with salt rounds
- **Input Sanitization**: Protection against NoSQL injection
- **XSS Protection**: Request body sanitization
- **CORS Policy**: Restricted origin access

### 3. Network Security
- **Helmet.js**: Security headers configuration
- **HTTPS Enforcement**: In production environments
- **Secure Cookies**: HTTP-only, SameSite, Secure flags

## Troubleshooting

### Common Issues:

#### 1. Bcrypt ELF Header Error
**Problem**: Native bcrypt module fails in Docker
**Solution**: Use bcryptjs instead of bcrypt (already configured)

#### 2. PORT Binding Issues
**Problem**: Application doesn't start on Cloud Run
**Solution**: Ensure `process.env.PORT` is used (already configured)

#### 3. UUID ESM Import Error
**Problem**: `require() of ES Module uuid not supported`
**Solution**: Use `crypto.randomUUID()` instead (already configured)

#### 4. Docker Build Failures
**Problem**: Native modules compilation issues
**Solution**: Use node:18-bullseye-slim base image (already configured)

### Debugging Steps:
1. Check Cloud Run logs: `gcloud run services logs read sams-backend`
2. Verify environment variables: `gcloud run services describe sams-backend`
3. Test health endpoints: `/health` and `/healthz`
4. Validate MongoDB connectivity

## Best Practices

### Staging vs Production:
- **Staging**: Use development environment with test data
- **Production**: Enable all security features and use real data
- **Monitoring**: Enable detailed logging in staging, minimal in production
- **Backups**: Regular database backups in production only

### Performance Optimization:
- **Connection Pooling**: Mongoose default connection pooling
- **Caching**: In-memory caching for frequently accessed data
- **Pagination**: API response pagination for large datasets
- **Compression**: Gzip compression for API responses

### Maintenance:
- **Log Rotation**: Automatic log management in Cloud Run
- **Health Checks**: Regular health endpoint monitoring
- **Dependency Updates**: Regular security audits with `npm audit`
- **Backup Strategy**: MongoDB Atlas automated backups