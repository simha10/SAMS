# Cloud Scheduler Payload Templates for SAMS

This document provides templates for Cloud Scheduler jobs that trigger SAMS backend endpoints.

## Daily Attendance Auto-Checkout Job

### Schedule
- **Frequency**: Daily at 8:00 PM (20:00)
- **Timezone**: Asia/Kolkata (or your local timezone)
- **Target**: Cloud Run service endpoint

### Payload Template
```json
{
  "job": "daily-auto-checkout",
  "description": "Auto-checkout all users who haven't checked out by 8:00 PM",
  "endpoint": "/api/jobs/auto-checkout",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${SERVICE_ACCOUNT_TOKEN}"
  },
  "payload": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "jobId": "daily-auto-checkout-$(date +%Y%m%d)"
  }
}
```

### Cloud Scheduler Command
```bash
gcloud scheduler jobs create http sams-daily-auto-checkout \
    --schedule="0 20 * * *" \
    --uri="https://sams-backend-PROJECT_ID.uc.run.app/api/jobs/auto-checkout" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body="{\"job\":\"daily-auto-checkout\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    --time-zone="Asia/Kolkata"
```

## Monthly Report Generation Job

### Schedule
- **Frequency**: First day of every month at 2:00 AM
- **Timezone**: Asia/Kolkata (or your local timezone)
- **Target**: Cloud Run service endpoint

### Payload Template
```json
{
  "job": "monthly-report-generation",
  "description": "Generate monthly attendance reports for all employees",
  "endpoint": "/api/jobs/monthly-reports",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${SERVICE_ACCOUNT_TOKEN}"
  },
  "payload": {
    "reportMonth": "$(date -d 'last month' +%Y-%m)",
    "reportType": "summary",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
```

### Cloud Scheduler Command
```bash
gcloud scheduler jobs create http sams-monthly-reports \
    --schedule="0 2 1 * *" \
    --uri="https://sams-backend-PROJECT_ID.uc.run.app/api/jobs/monthly-reports" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body="{\"job\":\"monthly-report-generation\",\"reportMonth\":\"$(date -d 'last month' +%Y-%m)\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    --time-zone="Asia/Kolkata"
```

## Weekly Birthday Notification Job

### Schedule
- **Frequency**: Every Monday at 9:00 AM
- **Timezone**: Asia/Kolkata (or your local timezone)
- **Target**: Cloud Run service endpoint

### Payload Template
```json
{
  "job": "weekly-birthday-notification",
  "description": "Send birthday notifications for the upcoming week",
  "endpoint": "/api/jobs/weekly-birthdays",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${SERVICE_ACCOUNT_TOKEN}"
  },
  "payload": {
    "weekStartDate": "$(date -d 'monday' +%Y-%m-%d)",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
```

### Cloud Scheduler Command
```bash
gcloud scheduler jobs create http sams-weekly-birthdays \
    --schedule="0 9 * * 1" \
    --uri="https://sams-backend-PROJECT_ID.uc.run.app/api/jobs/weekly-birthdays" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body="{\"job\":\"weekly-birthday-notification\",\"weekStartDate\":\"$(date -d 'monday' +%Y-%m-%d)\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    --time-zone="Asia/Kolkata"
```

## Daily Cleanup Job

### Schedule
- **Frequency**: Daily at 1:00 AM
- **Timezone**: Asia/Kolkata (or your local timezone)
- **Target**: Cloud Run service endpoint

### Payload Template
```json
{
  "job": "daily-cleanup",
  "description": "Clean up expired sessions and old logs",
  "endpoint": "/api/jobs/daily-cleanup",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${SERVICE_ACCOUNT_TOKEN}"
  },
  "payload": {
    "cleanupTypes": ["expired_sessions", "old_logs", "temporary_files"],
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
```

### Cloud Scheduler Command
```bash
gcloud scheduler jobs create http sams-daily-cleanup \
    --schedule="0 1 * * *" \
    --uri="https://sams-backend-PROJECT_ID.uc.run.app/api/jobs/daily-cleanup" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body="{\"job\":\"daily-cleanup\",\"cleanupTypes\":[\"expired_sessions\",\"old_logs\"],\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    --time-zone="Asia/Kolkata"
```

## Required IAM Permissions

The Cloud Scheduler service account needs the following permissions:

```bash
# Grant Cloud Scheduler service account permission to invoke Cloud Run service
gcloud run services add-iam-policy-binding sams-backend \
    --member="serviceAccount:PROJECT_ID@cloudscheduler.googleapis.com" \
    --role="roles/run.invoker" \
    --region=us-central1
```

## Testing Scheduler Jobs

To test a scheduler job manually:

```bash
# Run a job immediately
gcloud scheduler jobs run sams-daily-auto-checkout --location=us-central1

# Check job execution logs
gcloud scheduler jobs describe sams-daily-auto-checkout --location=us-central1

# View execution history
gcloud scheduler jobs list
```

## Monitoring and Alerting

Set up Cloud Monitoring alerts for job failures:

1. Create an alerting policy in Cloud Monitoring
2. Set the condition to trigger when job execution fails
3. Configure notification channels (email, SMS, Slack, etc.)

Example alert condition:
- Metric: `cloudscheduler.googleapis.com/job/execution/failure_count`
- Filter: `resource.type="cloud_scheduler_job"`
- Threshold: > 0
- Duration: 5 minutes