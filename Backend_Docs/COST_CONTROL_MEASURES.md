# Cost Control Measures for SAMS on Google Cloud Platform

This document outlines strategies and best practices for controlling costs when running the SAMS application on Google Cloud Platform.

## Cloud Run Cost Optimization

### 1. Instance Configuration
- **CPU Allocation**: Use 1 CPU for most workloads
- **Memory**: 512Mi for backend, 256Mi for frontend
- **Concurrency**: Set to 80 to maximize resource utilization
- **Max Instances**: Limit to 10 to control costs during traffic spikes

### 2. Autoscaling Settings
```bash
# Deploy with cost-conscious settings
gcloud run deploy sams-backend \
    --image gcr.io/PROJECT_ID/sams-backend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --concurrency 80 \
    --max-instances 10 \
    --timeout 300
```

### 3. Request Handling Optimization
- Implement efficient database queries with projections
- Use caching where appropriate
- Minimize external API calls
- Optimize response sizes

## MongoDB Atlas Cost Control

### 1. Cluster Selection
- **Free Tier**: M0 cluster for development/testing
- **Production**: M10 or M20 based on usage patterns
- **Shared Clusters**: Cost-effective for small workloads

### 2. Storage Optimization
- **TTL Indexes**: Automatically expire old data
- **Data Archiving**: Move old records to cheaper storage
- **Compression**: Enable compression for large collections

### 3. Connection Management
- **Connection Pooling**: Reuse database connections
- **Idle Connection Timeout**: Configure appropriate timeouts
- **Connection Limits**: Set reasonable connection limits

## Cloud Scheduler Cost Optimization

### 1. Job Frequency
- **Daily Jobs**: Run during off-peak hours
- **Weekly Jobs**: Schedule for weekends when possible
- **Monthly Jobs**: Run on first day of month

### 2. Payload Optimization
- **Minimal Payloads**: Send only necessary data
- **Batch Processing**: Combine multiple operations in single jobs

### 3. Monitoring
- **Job Success Rates**: Monitor for failures that might cause retries
- **Execution Time**: Optimize jobs to complete quickly

## Logging and Monitoring Costs

### 1. Log Retention
- **Default Logs**: 30-day retention
- **Audit Logs**: Longer retention for compliance
- **Debug Logs**: Short retention or exclusion in production

### 2. Log Exclusion
```bash
# Exclude verbose logs to reduce costs
gcloud logging sinks create sams-exclusion \
    "projects/PROJECT_ID/logs/exclude" \
    --log-filter="severity<INFO"
```

### 3. Metrics Optimization
- **Essential Metrics Only**: Monitor only critical metrics
- **Aggregation**: Use aggregated metrics where possible
- **Alerting**: Set appropriate thresholds to reduce noise

## Storage Cost Control

### 1. Cloud Storage (if used for reports)
- **Lifecycle Policies**: Automatically delete old reports
- **Multi-region**: Use single region for cost savings
- **Storage Classes**: Use Standard storage for active data

### 2. Database Storage
- **Regular Cleanup**: Remove unnecessary data
- **Archiving**: Move old data to cheaper storage
- **Index Optimization**: Remove unused indexes

## Network Cost Optimization

### 1. Regional Deployment
- **Single Region**: Deploy all services in same region
- **Regional Endpoints**: Use regional endpoints for services

### 2. Egress Optimization
- **CDN**: Use CDN for static assets
- **Compression**: Enable gzip compression
- **Caching**: Implement client-side caching

## Budget and Alerting

### 1. Budget Setup
```bash
# Create budget alert
gcloud billing budgets create \
    --display-name="SAMS Monthly Budget" \
    --budget-amount=100USD \
    --calendar-period=MONTH \
    --threshold-rule=threshold_percent=90,basis=CURRENT_SPEND \
    --threshold-rule=threshold_percent=100,basis=FORECASTED_SPEND
```

### 2. Cost Monitoring
- **Daily Reports**: Generate daily cost reports
- **Weekly Reviews**: Review spending patterns weekly
- **Monthly Analysis**: Detailed monthly cost analysis

## Estimated Monthly Costs

### Small Organization (50-100 employees)
| Service | Estimated Cost (USD) |
|---------|---------------------|
| Cloud Run (Backend) | $20-50 |
| Cloud Run (Frontend) | $10-30 |
| MongoDB Atlas (M10) | $50-100 |
| Cloud Storage | $5-15 |
| Cloud Scheduler | $0.10 |
| Logging/Monitoring | $10-20 |
| **Total** | **$95-215** |

### Medium Organization (100-500 employees)
| Service | Estimated Cost (USD) |
|---------|---------------------|
| Cloud Run (Backend) | $50-150 |
| Cloud Run (Frontend) | $30-100 |
| MongoDB Atlas (M20) | $100-200 |
| Cloud Storage | $15-50 |
| Cloud Scheduler | $0.10 |
| Logging/Monitoring | $20-50 |
| **Total** | **$215-550** |

## Cost Optimization Recommendations

### 1. Right-Sizing
- **Monitor Usage**: Regularly review resource utilization
- **Adjust Resources**: Scale up/down based on actual usage
- **Performance Testing**: Test with different configurations

### 2. Reserved Resources
- **Committed Use Discounts**: Consider for steady workloads
- **Sustained Use Discounts**: Automatically applied for consistent usage

### 3. Spot Resources
- **Preemptible Instances**: Use for fault-tolerant workloads
- **Spot VMs**: Cost-effective for batch processing

## Cost Control Best Practices

### 1. Resource Tagging
```bash
# Tag resources for cost allocation
gcloud run services update sams-backend \
    --update-labels=environment=production,team=hr,project=sams
```

### 2. Regular Audits
- **Monthly Reviews**: Review all services and costs
- **Unused Resources**: Identify and remove unused resources
- **Optimization Opportunities**: Look for optimization opportunities

### 3. Automation
- **Scheduled Scaling**: Automatically scale based on time/day
- **Cleanup Scripts**: Automated cleanup of temporary resources
- **Alerting**: Automated alerts for cost anomalies

## Monitoring and Reporting

### 1. Cost Dashboards
- **Cloud Monitoring**: Create custom cost dashboards
- **Budget Alerts**: Set up alerts for budget thresholds
- **Usage Reports**: Generate regular usage reports

### 2. Cost Allocation
- **Labels**: Use labels for cost allocation
- **Billing Accounts**: Separate billing for different environments
- **Team Allocation**: Allocate costs to responsible teams

## Conclusion

By implementing these cost control measures, you can effectively manage the expenses of running SAMS on Google Cloud Platform while maintaining performance and reliability. Regular monitoring and optimization are key to long-term cost efficiency.