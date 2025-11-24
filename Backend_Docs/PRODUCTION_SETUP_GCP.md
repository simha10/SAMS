# Production Setup Guide for SAMS on Google Cloud Platform

This document provides comprehensive instructions for setting up the SAMS application on Google Cloud Platform (GCP) with manual deployment.

## Prerequisites

1. Google Cloud Platform account with billing enabled
2. A project created in GCP
3. `gcloud` CLI installed and configured
4. Domain registered with Hostinger (or any domain registrar)
5. MongoDB Atlas account or self-managed MongoDB instance

## Architecture Overview

The SAMS application consists of:
- **Backend**: Node.js/Express application deployed to Cloud Run
- **Frontend**: React application (separate repository) deployed to Cloud Run or Firebase Hosting
- **Database**: MongoDB (Atlas or self-managed)
- **Authentication**: JWT-based with rotating tokens
- **Storage**: Cloud Storage for reports (optional)
- **Scheduling**: Cloud Scheduler for automated jobs
- **Monitoring**: Cloud Monitoring and Logging

## Step 1: Project Setup

### 1.1 Create GCP Project
```bash
# Create a new project (if not already created)
gcloud projects create sams-production --name="SAMS Production"

# Set the project as active
gcloud config set project sams-production

# Enable required APIs
gcloud services enable \
    run.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com \
    cloudscheduler.googleapis.com \
    monitoring.googleapis.com \
    logging.googleapis.com \
    cloudbuild.googleapis.com
```

### 1.2 Set Up Billing
Ensure billing is enabled for your project in the GCP Console.

## Step 2: Database Setup

### 2.1 MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Configure network access (whitelist your Cloud Run IP ranges)
4. Create a database user
5. Get the connection string

### 2.2 Self-Managed MongoDB (Alternative)
If using self-managed MongoDB, deploy it to Compute Engine or use a marketplace solution.

## Step 3: Secret Manager Configuration

### 3.1 Create Required Secrets
```bash
# Create MongoDB URI secret
echo -n "mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority" | \
gcloud secrets create sams-mongodb-uri --data-file=-

# Create JWT secret (generate a strong secret)
openssl rand -base64 32 | \
gcloud secrets create sams-jwt-secret --data-file=-

# Create refresh token secret (optional, for asymmetric tokens)
openssl rand -base64 32 | \
gcloud secrets create sams-refresh-secret --data-file=-
```

### 3.2 Grant Access to Cloud Run Service Account
```bash
# Get project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant access to secrets
gcloud secrets add-iam-policy-binding sams-mongodb-uri \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding sams-jwt-secret \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding sams-refresh-secret \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## Step 4: Container Registry Setup

### 4.1 Build and Push Docker Image
```bash
# Navigate to backend directory
cd backend

# Build the Docker image
docker build -t gcr.io/$(gcloud config get-value project)/sams-backend:latest .

# Push to Container Registry
docker push gcr.io/$(gcloud config get-value project)/sams-backend:latest
```

### 4.2 Alternative: Cloud Build
```bash
# Submit build using Cloud Build
gcloud builds submit --config cloudbuild.yaml .
```

## Step 5: Cloud Run Deployment

### 5.1 Deploy Service
```bash
gcloud run deploy sams-backend \
    --image gcr.io/$(gcloud config get-value project)/sams-backend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars NODE_ENV=production \
    --set-env-vars FRONTEND_URL=https://app.yourdomain.com \
    --set-env-vars PORT=8080 \
    --set-secrets MONGO_URI=sams-mongodb-uri:latest \
    --set-secrets JWT_SECRET=sams-jwt-secret:latest \
    --set-secrets REFRESH_SECRET=sams-refresh-secret:latest \
    --memory 512Mi \
    --cpu 1 \
    --concurrency 80 \
    --max-instances 10 \
    --timeout 300
```

### 5.2 Configure Custom Domain
1. In GCP Console, go to Cloud Run > sams-backend > Edit & Deploy New Revision
2. In the Networking section, click "Add Custom Domain"
3. Add your domain: `api.yourdomain.com`
4. Follow the verification steps

## Step 6: Cloud Scheduler Setup

### 6.1 Grant Permissions
```bash
# Grant Cloud Scheduler permission to invoke Cloud Run
gcloud run services add-iam-policy-binding sams-backend \
    --member="serviceAccount:$(gcloud config get-value project)@cloudscheduler.googleapis.com" \
    --role="roles/run.invoker" \
    --region=us-central1
```

### 6.2 Create Scheduler Jobs
```bash
# Daily auto-checkout job
gcloud scheduler jobs create http sams-daily-auto-checkout \
    --schedule="0 20 * * *" \
    --uri="https://sams-backend-$(gcloud config get-value project).uc.run.app/api/jobs/auto-checkout" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body="{\"job\":\"daily-auto-checkout\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    --time-zone="Asia/Kolkata"

# Monthly report generation job
gcloud scheduler jobs create http sams-monthly-reports \
    --schedule="0 2 1 * *" \
    --uri="https://sams-backend-$(gcloud config get-value project).uc.run.app/api/jobs/monthly-reports" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body="{\"job\":\"monthly-report-generation\",\"reportMonth\":\"$(date -d 'last month' +%Y-%m)\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    --time-zone="Asia/Kolkata"

# Weekly birthday notification job
gcloud scheduler jobs create http sams-weekly-birthdays \
    --schedule="0 9 * * 1" \
    --uri="https://sams-backend-$(gcloud config get-value project).uc.run.app/api/jobs/weekly-birthdays" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body="{\"job\":\"weekly-birthday-notification\",\"weekStartDate\":\"$(date -d 'monday' +%Y-%m-%d)\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    --time-zone="Asia/Kolkata"

# Daily cleanup job
gcloud scheduler jobs create http sams-daily-cleanup \
    --schedule="0 1 * * *" \
    --uri="https://sams-backend-$(gcloud config get-value project).uc.run.app/api/jobs/daily-cleanup" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body="{\"job\":\"daily-cleanup\",\"cleanupTypes\":[\"expired_sessions\",\"old_logs\"],\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    --time-zone="Asia/Kolkata"
```

## Step 7: Domain Mapping with Hostinger

### 7.1 Verify Domain Ownership
1. In GCP Console, go to APIs & Services > Credentials
2. Create a domain verification
3. Add your domain and follow verification steps

### 7.2 Add DNS Records in Hostinger
1. Log in to Hostinger
2. Go to Domains > Manage DNS
3. Add the following records:

For backend (`api.yourdomain.com`):
```
Type: CNAME
Name: api
Value: ghs.googlehosted.com
TTL: 3600
```

For frontend (`app.yourdomain.com`):
```
Type: CNAME
Name: app
Value: ghs.googlehosted.com
TTL: 3600
```

### 7.3 SSL Certificate
Google Cloud Run automatically provisions SSL certificates for custom domains. This may take a few minutes to hours.

## Step 8: Monitoring and Alerting

### 8.1 Set Up Monitoring
1. In GCP Console, go to Monitoring
2. Create uptime checks for your endpoints:
   - `https://api.yourdomain.com/healthz`
   - `https://api.yourdomain.com/health`

### 8.2 Create Alerting Policies
1. Create alerts for:
   - High error rates
   - High latency
   - Service downtime
   - Scheduler job failures

Example alert for high error rate:
```bash
# Create notification channel
gcloud monitoring channels create \
    --display-name="SAMS Alerts" \
    --type=email \
    --channel-labels=email_address=alerts@yourdomain.com

# Create alert policy
gcloud alpha monitoring policies create \
    --display-name="High Error Rate" \
    --conditions='{"conditionThreshold": {"filter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" metric.label.response_code>=500", "comparison": "COMPARISON_GT", "thresholdValue": 5, "duration": "60s"}}'
```

## Step 9: Database Index Initialization

### 9.1 Run Index Initialization Script
```bash
# Connect to your Cloud Run service or run locally with production credentials
node scripts/init-indexes.js
```

## Step 10: Testing

### 10.1 Health Check
```bash
curl -v https://api.yourdomain.com/healthz
curl -v https://api.yourdomain.com/health
```

### 10.2 Authentication Flow
```bash
# Login
curl -X POST https://api.yourdomain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Device-Id: test-device" \
    -d '{"empId": "EMP001", "password": "password123"}'

# Use the returned access token for subsequent requests
```

## Cost Control Measures

### 1. Cloud Run Settings
- Set maximum instances to control costs
- Use appropriate memory and CPU settings
- Configure concurrency settings

### 2. Database Optimization
- Use MongoDB Atlas tier appropriate for your needs
- Implement TTL indexes for logs and temporary data
- Monitor database connections

### 3. Monitoring and Logging
- Set log retention policies
- Use appropriate log levels in production
- Set up budget alerts

## Security Considerations

### 1. Network Security
- Use VPC if needed for additional security
- Restrict database access to Cloud Run IP ranges
- Use private services where possible

### 2. Secret Management
- Rotate secrets regularly
- Use least privilege for service accounts
- Audit secret access

### 3. Application Security
- Keep dependencies updated
- Implement proper input validation
- Use security headers
- Regular security scanning

## Maintenance

### 1. Regular Tasks
- Monitor logs and metrics
- Review and rotate secrets
- Update dependencies
- Backup critical data

### 2. Updates
- Test changes in staging environment
- Deploy during low-traffic periods
- Have rollback plans

### 3. Monitoring
- Set up dashboards for key metrics
- Configure alerts for anomalies
- Regular review of logs

## Troubleshooting

### Common Issues

1. **Deployment Failures**
   - Check build logs in Cloud Build
   - Verify Dockerfile correctness
   - Ensure all dependencies are specified

2. **Authentication Issues**
   - Verify secret values
   - Check token expiration settings
   - Review session management

3. **Database Connection Issues**
   - Verify network access rules
   - Check connection string format
   - Confirm database user permissions

4. **Domain Mapping Issues**
   - Verify DNS records
   - Check domain verification status
   - Wait for DNS propagation

### Useful Commands

```bash
# View Cloud Run logs
gcloud run services logs read sams-backend --region=us-central1

# View Cloud Scheduler job status
gcloud scheduler jobs list

# View secret versions
gcloud secrets versions list sams-mongodb-uri

# Update a secret
echo -n "new-value" | gcloud secrets versions add sams-mongodb-uri --data-file=-

# View service configuration
gcloud run services describe sams-backend --region=us-central1

# View deployment revisions
gcloud run revisions list --service=sams-backend --region=us-central1
```

## Next Steps

1. Set up the frontend application
2. Configure CI/CD pipeline
3. Implement backup and disaster recovery
4. Set up monitoring dashboards
5. Configure alerting policies
6. Perform load testing
7. Document operational procedures