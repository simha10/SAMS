# SAMS Production Runbook

This document provides operational procedures for managing the SAMS application in production.

## Table of Contents
1. [Deployment Procedures](#deployment-procedures)
2. [Rollback Procedures](#rollback-procedures)
3. [Secret Rotation](#secret-rotation)
4. [Cron Job Management](#cron-job-management)
5. [Health Checks and Troubleshooting](#health-checks-and-troubleshooting)
6. [Domain Verification](#domain-verification)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Incident Response](#incident-response)

## Deployment Procedures

### Deploying a New Version

1. **Build and Push Docker Image**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Build the Docker image
   docker build -t gcr.io/$(gcloud config get-value project)/sams-backend:$(git rev-parse --short HEAD) .
   
   # Push to Container Registry
   docker push gcr.io/$(gcloud config get-value project)/sams-backend:$(git rev-parse --short HEAD)
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy sams-backend \
       --image gcr.io/$(gcloud config get-value project)/sams-backend:$(git rev-parse --short HEAD) \
       --platform managed \
       --region us-central1 \
       --allow-unauthenticated \
       --set-env-vars NODE_ENV=production \
       --set-env-vars FRONTEND_URL=https://app.yourdomain.com \
       --set-env-vars PORT=8080 \
       --set-secrets MONGO_URI=sams-mongodb-uri:latest \
       --set-secrets JWT_SECRET=sams-jwt-secret:latest \
       --memory 512Mi \
       --cpu 1 \
       --concurrency 80 \
       --max-instances 10 \
       --timeout 300
   ```

3. **Verify Deployment**
   ```bash
   # Check service status
   gcloud run services describe sams-backend --region=us-central1
   
   # Test health endpoints
   curl -v https://api.yourdomain.com/healthz
   curl -v https://api.yourdomain.com/health
   ```

### Post-Deployment Validation

1. Test authentication flow
2. Test attendance check-in/out
3. Test leave request submission
4. Verify manager functionalities
5. Check report generation
6. Validate unusual login detection

## Rollback Procedures

### Rolling Back to Previous Version

1. **Identify Previous Version**
   ```bash
   # List revisions
   gcloud run revisions list --service=sams-backend --region=us-central1
   
   # Get specific revision details
   gcloud run revisions describe REVISION_NAME --region=us-central1
   ```

2. **Rollback to Previous Revision**
   ```bash
   # Traffic migration to previous revision
   gcloud run services update-traffic sams-backend \
       --to-revisions=PREVIOUS_REVISION_NAME=100 \
       --region=us-central1
   ```

3. **Verify Rollback**
   ```bash
   # Check current traffic allocation
   gcloud run services describe sams-backend --region=us-central1
   
   # Test functionality
   curl -v https://api.yourdomain.com/healthz
   ```

### Emergency Rollback

In case of critical issues:

1. Immediately redirect traffic to the last known good revision
2. Notify the team
3. Investigate the issue
4. Prepare a hotfix if needed

## Secret Rotation

### JWT Secret Rotation

1. **Generate New Secret**
   ```bash
   # Generate new JWT secret
   NEW_SECRET=$(openssl rand -base64 32)
   
   # Add as new version
   echo -n "$NEW_SECRET" | gcloud secrets versions add sams-jwt-secret --data-file=-
   ```

2. **Deploy New Version with Updated Secret**
   ```bash
   # Deploy with latest secret version
   gcloud run deploy sams-backend \
       --image gcr.io/$(gcloud config get-value project)/sams-backend:latest \
       --platform managed \
       --region us-central1 \
       --allow-unauthenticated \
       --set-secrets MONGO_URI=sams-mongodb-uri:latest \
       --set-secrets JWT_SECRET=sams-jwt-secret:latest
   ```

3. **Verify and Cleanup**
   ```bash
   # Test authentication
   # After confirming it works, destroy old versions
   gcloud secrets versions destroy sams-jwt-secret --version=OLD_VERSION
   ```

### Database Credential Rotation

1. **Update MongoDB Atlas**
   - Create new database user
   - Update connection string in Secret Manager
   ```bash
   echo -n "new_connection_string" | gcloud secrets versions add sams-mongodb-uri --data-file=-
   ```

2. **Deploy Updated Configuration**
   ```bash
   gcloud run deploy sams-backend \
       --image gcr.io/$(gcloud config get-value project)/sams-backend:latest \
       --platform managed \
       --region us-central1 \
       --allow-unauthenticated \
       --set-secrets MONGO_URI=sams-mongodb-uri:latest \
       --set-secrets JWT_SECRET=sams-jwt-secret:latest
   ```

3. **Verify and Cleanup**
   - Test database connectivity
   - Destroy old secret versions after confirmation

## Cron Job Management

### Testing Cron Jobs

1. **Manual Execution**
   ```bash
   # Run a job immediately
   gcloud scheduler jobs run sams-daily-auto-checkout --location=us-central1
   
   # Check execution status
   gcloud scheduler jobs describe sams-daily-auto-checkout --location=us-central1
   ```

2. **View Execution History**
   ```bash
   # List job executions
   gcloud scheduler jobs list
   
   # Check logs for specific job
   gcloud logging read "resource.type=cloud_scheduler_job AND resource.labels.job_id=sams-daily-auto-checkout"
   ```

### Updating Cron Jobs

1. **Update Job Schedule**
   ```bash
   gcloud scheduler jobs update http sams-daily-auto-checkout \
       --schedule="0 19 * * *" \
       --uri="https://sams-backend-$(gcloud config get-value project).uc.run.app/api/jobs/auto-checkout" \
       --time-zone="Asia/Kolkata"
   ```

2. **Update Job Payload**
   ```bash
   gcloud scheduler jobs update http sams-daily-auto-checkout \
       --message-body="{\"job\":\"daily-auto-checkout\",\"newParameter\":\"value\"}"
   ```

### Creating New Cron Jobs

```bash
gcloud scheduler jobs create http sams-new-job \
    --schedule="0 2 * * *" \
    --uri="https://sams-backend-$(gcloud config get-value project).uc.run.app/api/jobs/new-endpoint" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body="{\"job\":\"new-job\"}" \
    --time-zone="Asia/Kolkata"
```

## Health Checks and Troubleshooting

### Health Check Endpoints

1. **General Health Check**
   ```bash
   curl -v https://api.yourdomain.com/health
   ```

2. **Cloud Run Health Check**
   ```bash
   curl -v https://api.yourdomain.com/healthz
   ```

### Common Issues and Solutions

#### 1. Authentication Failures

**Symptoms**: 401 errors, token expiration issues

**Troubleshooting**:
```bash
# Check logs for authentication errors
gcloud run services logs read sams-backend --region=us-central1 --limit=50

# Verify secret values
gcloud secrets versions access latest --secret=sams-jwt-secret
```

#### 2. Database Connection Issues

**Symptoms**: 500 errors, timeout errors

**Troubleshooting**:
```bash
# Check database connectivity
gcloud secrets versions access latest --secret=sams-mongodb-uri

# Check network access in MongoDB Atlas
# Verify IP whitelist settings
```

#### 3. Performance Issues

**Symptoms**: Slow responses, timeouts

**Troubleshooting**:
```bash
# Check Cloud Run metrics
gcloud monitoring metrics list --filter="run.googleapis.com"

# Check instance scaling
gcloud run services describe sams-backend --region=us-central1
```

#### 4. Geofence Validation Issues

**Symptoms**: Incorrect geofence validation

**Troubleshooting**:
```bash
# Check branch data
# Verify branch coordinates and radius
# Test Haversine calculations
```

## Domain Verification

### Verifying Domain Ownership

1. **Add Verification Record**
   ```bash
   # Get verification token from GCP Console
   # Add TXT record in Hostinger DNS management
   ```

2. **Verify Domain**
   ```bash
   # In GCP Console, trigger domain verification
   # Or use gcloud command if available
   ```

### Troubleshooting Domain Issues

1. **DNS Propagation**
   ```bash
   # Check DNS records
   nslookup api.yourdomain.com
   nslookup -type=CNAME api.yourdomain.com
   
   # Use online tools like dnschecker.org
   ```

2. **SSL Certificate Issues**
   ```bash
   # Check certificate status in Cloud Run
   # Wait for automatic provisioning
   # Contact support if issues persist
   ```

## Monitoring and Logging

### Viewing Application Logs

```bash
# View recent logs
gcloud run services logs read sams-backend --region=us-central1 --limit=100

# View logs with specific filter
gcloud run services logs read sams-backend --region=us-central1 --filter="severity>=ERROR"

# Stream logs in real-time
gcloud run services logs read sams-backend --region=us-central1 --follow
```

### Monitoring Metrics

1. **Cloud Run Metrics**
   - Request count
   - Latency
   - Error rate
   - Instance count

2. **Custom Metrics**
   - Authentication success/failure rates
   - Geofence validation results
   - Unusual login detections

### Setting Up Alerts

```bash
# Create notification channel
gcloud monitoring channels create \
    --display-name="SAMS Production Alerts" \
    --type=email \
    --channel-labels=email_address=ops@yourdomain.com

# Create alert policy for high error rate
gcloud alpha monitoring policies create \
    --display-name="High Error Rate Alert" \
    --conditions='{"conditionThreshold": {"filter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" metric.label.response_code>=500", "comparison": "COMPARISON_GT", "thresholdValue": 5, "duration": "60s"}}' \
    --notification-channels=CHANNEL_ID
```

## Incident Response

### Unusual Login Detection Response

1. **Identify the Incident**
   ```bash
   # Check unusual action logs
   gcloud logging read "resource.type=gae_app AND jsonPayload.actionType=multi_user_device"
   ```

2. **Investigate**
   - Check user accounts involved
   - Verify device information
   - Review session history
   - Contact affected users

3. **Resolution**
   - Disable suspicious sessions
   - Reset user passwords if needed
   - Update unusual action log as resolved
   - Document findings

### Database Incident Response

1. **Connection Issues**
   - Check MongoDB Atlas status
   - Verify network access
   - Check connection string
   - Review logs for specific errors

2. **Data Corruption**
   - Identify affected data
   - Restore from backups if available
   - Implement data validation
   - Document incident

### Performance Degradation

1. **Identify Bottleneck**
   - Check Cloud Run metrics
   - Review application logs
   - Analyze database queries
   - Check external service dependencies

2. **Mitigation**
   - Scale Cloud Run instances
   - Optimize database queries
   - Implement caching
   - Add database indexes

### Security Incident Response

1. **Immediate Actions**
   - Isolate affected systems
   - Change compromised credentials
   - Review access logs
   - Notify security team

2. **Investigation**
   - Analyze logs for suspicious activity
   - Check for unauthorized access
   - Review recent changes
   - Document findings

3. **Recovery**
   - Restore from clean backups
   - Implement additional security measures
   - Update security policies
   - Conduct post-incident review

## Maintenance Windows

### Scheduled Maintenance

1. **Announce Maintenance Window**
   - Notify users in advance
   - Schedule during low-traffic periods
   - Provide alternative communication channels

2. **Perform Maintenance**
   - Follow deployment procedures
   - Monitor system during maintenance
   - Test functionality after completion

3. **Post-Maintenance**
   - Verify all systems are operational
   - Notify users of completion
   - Document changes made

### Emergency Maintenance

1. **Assess Impact**
   - Determine severity of issue
   - Decide if immediate action is required
   - Notify stakeholders

2. **Execute Fix**
   - Follow rollback procedures if needed
   - Deploy hotfix if available
   - Monitor system closely

3. **Communicate**
   - Keep stakeholders informed
   - Provide regular updates
   - Document resolution

## Contact Information

### Primary Contacts
- **Operations Lead**: ops@yourdomain.com
- **Development Lead**: dev@yourdomain.com
- **Security Lead**: security@yourdomain.com

### Escalation Procedures
1. Non-critical issues: ops@yourdomain.com
2. Critical issues: dev@yourdomain.com, security@yourdomain.com
3. Emergency: All contacts + SMS notifications

### Vendor Contacts
- **Google Cloud Support**: Available through GCP Console
- **MongoDB Atlas Support**: Available through MongoDB Atlas portal
- **Hostinger Support**: Available through Hostinger account

## Change Log

| Date | Change | Author | Impact |
|------|--------|--------|--------|
| 2025-11-20 | Initial runbook creation | System Administrator | None |