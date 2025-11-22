# SAMS Frontend - Production Preparation Guide

This document provides comprehensive instructions for preparing the SAMS frontend for production deployment on Google Cloud Platform.

## Production-Ready Features

### Authentication Flow
- **Secure Token Storage**: Access tokens stored in-memory using Zustand (no localStorage)
- **Automatic Token Refresh**: Axios interceptors handle 401 errors and refresh tokens automatically
- **Device Identification**: UUID-based device tracking via `X-Device-Id` header
- **Logout Warning**: Modal warning before logout to prevent accidental session termination

### UI/UX Features
- **Unusual Login Modal**: Notification modal for security alerts
- **Birthday Popup**: Automatic birthday celebration notifications
- **Mini-map Branch Visualizer**: Interactive map showing branch locations
- **Responsive Design**: Mobile-friendly interface for on-the-go check-ins

### Performance Optimizations
- **Code Splitting**: Route-based code splitting for faster initial loads
- **Lazy Loading**: Components loaded on-demand
- **Bundle Optimization**: Production build with minification and tree-shaking
- **Caching Strategies**: HTTP caching headers for static assets

## Production Build Configuration

### Vite Configuration
The frontend uses Vite as the build tool with the following production optimizations:

```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable in production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-*', 'lucide-react'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
```

### Environment Variables
Create a `.env.production` file with production values:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=SAMS - Geo-Fence Attendance System
VITE_APP_VERSION=1.0.0
```

### Build Commands
```bash
# Production build
pnpm run build

# Preview production build locally
pnpm run preview

# Lint code
pnpm run lint
```

## Deployment Options

### Option 1: Cloud Run Deployment

#### Dockerfile for Frontend
Create a `Dockerfile` in the root directory:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration
Create an `nginx.conf` file:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    server {
        listen 80;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
}
```

#### Deployment Commands
```bash
# Build and push Docker image
docker build -t gcr.io/PROJECT_ID/sams-frontend:latest .
docker push gcr.io/PROJECT_ID/sams-frontend:latest

# Deploy to Cloud Run
gcloud run deploy sams-frontend \
    --image gcr.io/PROJECT_ID/sams-frontend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 256Mi \
    --cpu 1 \
    --concurrency 80 \
    --max-instances 10
```

### Option 2: Firebase Hosting Deployment

#### Firebase Configuration
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase project:
   ```bash
   firebase login
   firebase init hosting
   ```

3. Update `firebase.json`:
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ],
       "headers": [
         {
           "source": "**",
           "headers": [
             {
               "key": "Cache-Control",
               "value": "no-cache"
             },
             {
               "key": "X-Frame-Options",
               "value": "SAMEORIGIN"
             },
             {
               "key": "X-XSS-Protection",
               "value": "1; mode=block"
             }
           ]
         },
         {
           "source": "**/*.@(js|css)",
           "headers": [
             {
               "key": "Cache-Control",
               "value": "max-age=31536000"
             }
           ]
         }
       ]
     }
   }
   ```

4. Deploy to Firebase:
   ```bash
   # Build the application
   pnpm run build
   
   # Deploy to Firebase
   firebase deploy --only hosting
   ```

## Security Considerations

### Token Management
- **In-Memory Storage**: Access tokens never persisted to disk
- **HttpOnly Cookies**: Refresh tokens stored in HttpOnly cookies (recommended)
- **Secure Headers**: CSP, XSS protection, and frame protection headers

### Device Tracking
- **UUID Generation**: Client-side UUID generation for device identification
- **Header Injection**: `X-Device-Id` header added to all API requests
- **Session Binding**: Device-bound sessions for enhanced security

### Input Validation
- **Frontend Validation**: Zod schemas for form validation
- **Backend Validation**: Server-side validation for all inputs
- **Sanitization**: XSS protection for user-generated content

## Performance Optimization

### Bundle Analysis
```bash
# Install bundle analyzer
pnpm add -D vite-bundle-analyzer

# Analyze bundle size
pnpm exec vite-bundle-analyzer dist
```

### Code Splitting
Routes are automatically code-split for optimal loading:

```typescript
// Lazy-loaded routes
const EmployeeDashboard = lazy(() => import('@/pages/employee/Dashboard'));
const ManagerAttendance = lazy(() => import('@/pages/Manager/Attendance'));
```

### Caching Strategy
- **Static Assets**: Long-term caching with content hashing
- **API Responses**: React Query caching with TTL
- **Component State**: Zustand for global state management

## Monitoring and Analytics

### Error Tracking
- **Error Boundaries**: React error boundaries for graceful error handling
- **Logging**: Structured error logging with context
- **Reporting**: Integration with error tracking services (optional)

### Performance Monitoring
- **Web Vitals**: Core Web Vitals tracking
- **Load Times**: Page load performance monitoring
- **User Experience**: Interaction performance metrics

## Testing Strategy

### Unit Tests
```bash
# Run unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Generate coverage report
pnpm run test:coverage
```

### Integration Tests
- **API Integration**: Mock service workers for API testing
- **Component Testing**: React Testing Library for component tests
- **E2E Testing**: Cypress or Playwright for end-to-end tests

### CI/CD Pipeline
Example GitHub Actions workflow:

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Run linter
      run: pnpm run lint
    
    - name: Run tests
      run: pnpm run test:ci
    
    - name: Build
      run: pnpm run build
    
    - name: Deploy to Firebase
      if: github.ref == 'refs/heads/main'
      run: firebase deploy --only hosting
      env:
        FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## Environment-Specific Configuration

### Development
```env
VITE_API_URL=http://localhost:5000
VITE_APP_ENV=development
```

### Staging
```env
VITE_API_URL=https://staging-api.yourdomain.com
VITE_APP_ENV=staging
```

### Production
```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_ENV=production
```

## Domain Mapping

### Cloud Run Domain Mapping
1. In GCP Console, go to Cloud Run > sams-frontend > Edit & Deploy New Revision
2. In the Networking section, click "Add Custom Domain"
3. Add your domain: `app.yourdomain.com`
4. Follow the verification steps

### Firebase Hosting Domain Mapping
1. In Firebase Console, go to Hosting
2. Add custom domain
3. Follow DNS verification steps
4. Update DNS records in Hostinger

## Troubleshooting

### Common Issues

#### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Clear node_modules and reinstall

#### Runtime Errors
- Check browser console for errors
- Verify API endpoint accessibility
- Confirm environment variables are set

#### Performance Issues
- Analyze bundle size
- Check network requests
- Optimize images and assets

### Debugging Commands
```bash
# Check build output
ls -la dist/

# Serve build locally
pnpm run preview

# Check for TypeScript errors
pnpm run type-check

# Lint code
pnpm run lint
```

## Maintenance

### Regular Updates
- Update dependencies regularly
- Monitor for security vulnerabilities
- Test after updates

### Monitoring
- Set up uptime monitoring
- Monitor error rates
- Track performance metrics

### Backup
- Version control all configuration files
- Document deployment procedures
- Maintain rollback plans

## Next Steps

1. Configure CI/CD pipeline
2. Set up monitoring and alerting
3. Implement backup and disaster recovery
4. Conduct load testing
5. Document operational procedures
6. Train operations team