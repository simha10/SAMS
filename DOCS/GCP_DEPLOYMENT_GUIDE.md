# GCP Cloud Run Deployment Guide

This guide provides comprehensive instructions for deploying both the backend and frontend of the SAMS application to Google Cloud Platform using Cloud Run.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Secrets Management](#secrets-management)
6. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

Before deploying to GCP Cloud Run, ensure you have:

- Google Cloud SDK installed and authenticated
- A Google Cloud Project created
- Required APIs enabled:
  ```bash
  gcloud services enable run.googleapis.com
  gcloud services enable cloudbuild.googleapis.com
  gcloud services enable artifactregistry.googleapis.com
  gcloud services enable secretmanager.googleapis.com
  ```

## Backend Deployment

### 1. Prepare Backend for Deployment

The backend is already configured for Cloud Run deployment with:
- A production-ready Dockerfile
- Proper environment variable handling
- Cloud Build configuration
- Statelessness for horizontal scaling

### 2. Configure Environment Variables

For Cloud Run deployment, set the `RUN_CRON` environment variable to `false` to prevent duplicate cron job execution across multiple instances:

```bash
# Required environment variables for backend
NODE_ENV=production
PORT=8080
MONGO_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-secure-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
REDIS_URL=rediss://default:your-password@your-redis-host:port
RUN_CRON=false
```

### 3. Deploy Backend to Cloud Run

```bash
# Deploy backend service
gcloud run deploy sams-backend \
  --image asia-south1-docker.pkg.dev/your-project-id/sams-backend-repo/sams-backend:latest \
  --platform managed \
  --region asia-south1 \
  --port 8080 \
  --set-env-vars NODE_ENV=production,RUN_CRON=false \
  --set-secrets MONGO_URI=MONGO_URI:latest,JWT_SECRET=JWT_SECRET:latest,REDIS_URL=REDIS_URL:latest,FRONTEND_URL=FRONTEND_URL:latest \
  --allow-unauthenticated
```

### 4. Alternative: Deploy Using gcloud with All Settings

```bash
# Deploy with all configurations at once
gcloud run deploy sams-backend \
  --image asia-south1-docker.pkg.dev/your-project-id/sams-backend-repo/sams-backend:latest \
  --platform managed \
  --region asia-south1 \
  --port 8080 \
  --set-env-vars NODE_ENV=production,RUN_CRON=false \
  --set-secrets MONGO_URI=MONGO_URI:latest,JWT_SECRET=JWT_SECRET:latest,REDIS_URL=REDIS_URL:latest,FRONTEND_URL=FRONTEND_URL:latest \
  --min-instances 0 \
  --max-instances 10 \
  --cpu 1 \
  --memory 512Mi \
  --allow-unauthenticated
```

## Frontend Deployment

### 1. Build Frontend for Production

The frontend needs to be built and served as static files. First, build the application:

```bash
# From the root directory
cd e:/SAMS
pnpm install
pnpm run build
```

This creates a `dist` directory with the production-ready frontend.

### 2. Create Frontend Dockerfile

Create a new file `Dockerfile.frontend` in the root directory:

```Dockerfile
FROM nginx:alpine

# Copy built frontend files
COPY dist/ /usr/share/nginx/html/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for Cloud Run
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
```

### 3. Create Nginx Configuration

Create a file `nginx.conf` in the root directory:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    server {
        listen 80;
        
        # Serve static files
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
    }
}
```

### 4. Build and Deploy Frontend

```bash
# Build the frontend Docker image
docker build -f Dockerfile.frontend -t asia-south1-docker.pkg.dev/your-project-id/sams-frontend-repo/sams-frontend:latest .

# Push to Artifact Registry
docker push asia-south1-docker.pkg.dev/your-project-id/sams-frontend-repo/sams-frontend:latest

# Deploy to Cloud Run
gcloud run deploy sams-frontend \
  --image asia-south1-docker.pkg.dev/your-project-id/sams-frontend-repo/sams-frontend:latest \
  --platform managed \
  --region asia-south1 \
  --port 80 \
  --set-env-vars VITE_API_URL=https://your-backend-url.run.app \
  --min-instances 0 \
  --max-instances 5 \
  --cpu 1 \
  --memory 256Mi \
  --allow-unauthenticated
```

## Environment Configuration

### Backend Environment Variables

| Variable | Description | Required | Notes |
|----------|-------------|----------|-------|
| NODE_ENV | Environment mode | Yes | Set to 'production' |
| PORT | Server port | Yes | Cloud Run standard: 8080 |
| MONGO_URI | MongoDB connection string | Yes | Use Secret Manager |
| JWT_SECRET | JWT signing secret | Yes | Use Secret Manager |
| FRONTEND_URL | Frontend origin for CORS | Yes | Use Secret Manager |
| REDIS_URL | Redis connection URL | Yes | Use Secret Manager |
| RUN_CRON | Cron job control | Yes | Set to 'false' for Cloud Run |

### Frontend Environment Variables

| Variable | Description | Required | Notes |
|----------|-------------|----------|-------|
| VITE_API_URL | Backend API URL | Yes | Format: https://backend-url.run.app |

## Secrets Management

### Creating Secrets in GCP Secret Manager

```bash
# Create secrets for backend
echo -n "your-mongodb-uri" | gcloud secrets create MONGO_URI --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "https://your-frontend-url.run.app" | gcloud secrets create FRONTEND_URL --data-file=-
echo -n "rediss://default:password@host:port" | gcloud secrets create REDIS_URL --data-file=-

# List created secrets
gcloud secrets list
```

### Using Secrets in Cloud Run

When deploying, use the `--set-secrets` flag to map secret versions to environment variables:

```bash
--set-secrets MONGO_URI=MONGO_URI:latest,JWT_SECRET=JWT_SECRET:latest,FRONTEND_URL=FRONTEND_URL:latest,REDIS_URL=REDIS_URL:latest
```

## CI/CD Pipeline Setup

### Backend Cloud Build Configuration

The backend already includes a `cloudbuild.yaml` file that:
- Builds the Docker image
- Pushes to Artifact Registry
- Can be triggered via GitHub integration

### Setting Up Build Triggers

```bash
# Create a build trigger for backend
gcloud builds triggers create github \
  --name="sams-backend" \
  --repo-name="sams" \
  --repo-owner="your-github-username" \
  --branch-pattern="main" \
  --build-config="backend/cloudbuild.yaml"
```

### Frontend Build Process

For the frontend, create a `cloudbuild.frontend.yaml`:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/npm'
    args: ['install']
    dir: '.'
  
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'build']
    dir: '.'
    env:
      - 'NODE_ENV=production'
      - 'VITE_API_URL=$VITE_API_URL'
    secretEnv: ['VITE_API_URL']
  
  - name: 'gcr.io/cloud-builders/docker'
    args:
      [
        'build',
        '-f', 'Dockerfile.frontend',
        '-t', 'asia-south1-docker.pkg.dev/$PROJECT_ID/sams-frontend-repo/sams-frontend:$COMMIT_SHA',
        '-t', 'asia-south1-docker.pkg.dev/$PROJECT_ID/sams-frontend-repo/sams-frontend:latest',
        '.'
      ]
    dir: '.'
  
  - name: 'gcr.io/cloud-builders/docker'
    args:
      [
        'push',
        'asia-south1-docker.pkg.dev/$PROJECT_ID/sams-frontend-repo/sams-frontend:$COMMIT_SHA'
      ]
    dir: '.'
  
  - name: 'gcr.io/cloud-builders/docker'
    args:
      [
        'push',
        'asia-south1-docker.pkg.dev/$PROJECT_ID/sams-frontend-repo/sams-frontend:latest'
      ]
    dir: '.'

availableSecrets:
  secretManager:
  - versionName: projects/your-project-id/secrets/VITE_API_URL/versions/latest
    env: 'VITE_API_URL'

images:
  - 'asia-south1-docker.pkg.dev/$PROJECT_ID/sams-frontend-repo/sams-frontend:$COMMIT_SHA'
  - 'asia-south1-docker.pkg.dev/$PROJECT_ID/sams-frontend-repo/sams-frontend:latest'

options:
  logging: CLOUD_LOGGING_ONLY
```

## Monitoring and Maintenance

### Health Checks

Both services include health check endpoints:
- Backend: `/health` endpoint
- Frontend: Built-in nginx health check at `/health`

### Logging and Monitoring

```bash
# View logs for backend
gcloud run services logs read sams-backend --platform managed --region asia-south1

# View logs for frontend
gcloud run services logs read sams-frontend --platform managed --region asia-south1
```

### Scaling Configuration

The deployment includes auto-scaling settings:
- Min instances: 0 (scale to zero when not in use)
- Max instances: Configured based on expected load
- CPU and memory limits optimized for cost efficiency

### Updating Deployments

To update a service after making changes:

```bash
# Update backend with new image
gcloud run deploy sams-backend \
  --image asia-south1-docker.pkg.dev/your-project-id/sams-backend-repo/sams-backend:latest \
  --platform managed \
  --region asia-south1

# Update frontend with new image
gcloud run deploy sams-frontend \
  --image asia-south1-docker.pkg.dev/your-project-id/sams-frontend-repo/sams-frontend:latest \
  --platform managed \
  --region asia-south1
```

## Troubleshooting

### Common Issues

1. **Container crashes immediately**: Check the logs with `gcloud run services logs read` to identify the issue.

2. **Environment variables not working**: Ensure secrets are properly created and mapped in Cloud Run configuration.

3. **CORS errors**: Verify that FRONTEND_URL secret matches the actual frontend URL.

4. **Database connection issues**: Check that MONGO_URI secret is correctly formatted and accessible.

5. **Redis connection issues**: Verify REDIS_URL format and network accessibility.

### Performance Tips

1. **Optimize container size**: The Dockerfiles are already optimized for minimal size.

2. **Use regional resources**: Deploy services in the same region to reduce latency.

3. **Monitor resource usage**: Adjust CPU and memory settings based on actual usage patterns.

4. **Enable Cloud Run CPU always allocated** for consistent performance if needed.

## Cost Optimization

1. **Scale to zero**: Min instances set to 0 ensures no cost when not in use.

2. **Optimize resource allocation**: CPU and memory settings are optimized for cost-effectiveness.

3. **Use Cloud Build free tier**: Up to 120 build minutes per day are free.

4. **Monitor usage**: Set up billing alerts to monitor Cloud Run usage costs.

## Security Best Practices

1. **Secrets management**: All sensitive data stored in Secret Manager.

2. **Network security**: Services deployed with appropriate security settings.

3. **CORS configuration**: Properly configured for frontend-backend communication.

4. **JWT security**: Properly configured HTTP-only cookies for authentication.

5. **Rate limiting**: Built-in Redis-based rate limiting for security.

This deployment approach ensures a secure, scalable, and cost-effective production deployment of the SAMS application on Google Cloud Platform.