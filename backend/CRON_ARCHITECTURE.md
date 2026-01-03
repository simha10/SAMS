# Dual-Mode CRON Execution Architecture

## Overview
This document describes the dual-mode CRON execution architecture that enables secure production execution via Google Cloud Scheduler while allowing easy local testing and development.

## Architecture Components

### 1. Environment-Based Authentication
The system uses environment variables to determine authentication mode:

- **Production Mode**: `NODE_ENV=production` AND `PLATFORM=gcp`
- **Development Mode**: Any other combination

### 2. Authentication Methods

#### Production (Google Cloud Run + Scheduler)
- Requires Google OIDC token in Authorization header
- Validates token audience against `CLOUD_RUN_SERVICE_URL`
- Only accepts requests from Google Cloud Scheduler service account

#### Development/Local Testing
- Supports `X-CRON-DEV-KEY` header with shared secret
- Supports `ALLOW_LOCAL_CRON=true` environment variable
- Falls back to Google OIDC validation if development methods fail

### 3. Separation of Concerns
- **Logic Layer**: Pure functions in `jobs/*.logic.js` files
- **HTTP Layer**: Thin controllers in `controllers/cronController.js`
- **Authentication Layer**: Dual-mode middleware in `verifyCronRequest`

## Environment Variables

Required for the dual-mode architecture:

```env
# Production security (required in production)
CLOUD_RUN_SERVICE_URL=https://your-service-name-xyz-uc.a.run.app

# Development/local testing (optional)
ALLOW_LOCAL_CRON=true  # Allow local cron execution when true
CRON_DEV_SECRET=your-secret-key  # Shared secret for X-CRON-DEV-KEY header

# Platform configuration
NODE_ENV=production     # or development
PLATFORM=gcp           # or local
RUN_CRON=false         # Must be false on Cloud Run
```

## Usage Patterns

### Production (Google Cloud Scheduler)
1. Set `NODE_ENV=production` and `PLATFORM=gcp`
2. Configure Cloud Scheduler with OIDC authentication
3. Requests automatically validated via Google OIDC tokens

### Local Development
#### Option 1: Using Shared Secret
```bash
curl -X POST \
  -H "X-CRON-DEV-KEY: your-cron-dev-secret" \
  -H "Content-Type: application/json" \
  https://localhost:8080/api/crons/mark-absentee
```

#### Option 2: Using Environment Flag
```bash
# Set environment variable
export ALLOW_LOCAL_CRON=true

# Then make requests normally (without auth headers)
curl -X POST \
  -H "Content-Type: application/json" \
  https://localhost:8080/api/crons/mark-absentee
```

### Direct Logic Testing
The business logic is available as pure functions for direct testing:

```javascript
// Import and test logic directly
const { markAbsenteeLogic } = require('./src/jobs/absentee.logic');
const result = await markAbsenteeLogic();
console.log(result); // { absentees: 5, onLeave: 2, totalProcessed: 20, date: '2026-01-03' }
```

## API Endpoints

All CRON endpoints are secured with the dual-mode authentication:

- `POST /api/crons/mark-absentee` - Daily absentee marking
- `POST /api/crons/send-daily-summary` - Daily summary report
- `POST /api/crons/auto-checkout` - Auto checkout processing
- `POST /api/crons/send-birthday-wishes` - Birthday notifications
- `POST /api/crons/run-all` - Combined endpoint to run all cron jobs (for testing/backup)
- `GET /api/crons/health` - Health check

## Security Guarantees

1. **Production Security**: Only Google Cloud Scheduler can execute CRON jobs
2. **Development Flexibility**: Multiple testing methods available
3. **Zero Behavior Drift**: Same logic executes in all environments
4. **Observability**: All executions logged with source tracking

## Local Testing Implementation Guide

### Complete Setup for Local Environment

#### 1. Environment Configuration
Create a local `.env` file with the following configuration:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# Database Configuration
MONGO_URI=your_mongo_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# CRON Configuration for Local Testing
RUN_CRON=false  # Disable built-in cron jobs in local development
ALLOW_LOCAL_CRON=true  # Enable local cron testing
CRON_DEV_SECRET=local-dev-secret  # Secret for local cron testing
PLATFORM=local  # Set to local for development

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### 2. Starting the Local Server
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm run dev
```

#### 3. Testing CRON Endpoints Locally

##### Option A: Using the Shared Secret Method
```bash
# Test absentee marking
curl -X POST \
  -H "X-CRON-DEV-KEY: local-dev-secret" \
  -H "Content-Type: application/json" \
  http://localhost:8080/api/crons/mark-absentee

# Test daily summary
curl -X POST \
  -H "X-CRON-DEV-KEY: local-dev-secret" \
  -H "Content-Type: application/json" \
  http://localhost:8080/api/crons/send-daily-summary

# Test auto checkout
curl -X POST \
  -H "X-CRON-DEV-KEY: local-dev-secret" \
  -H "Content-Type: application/json" \
  http://localhost:8080/api/crons/auto-checkout

# Test birthday wishes
curl -X POST \
  -H "X-CRON-DEV-KEY: local-dev-secret" \
  -H "Content-Type: application/json" \
  http://localhost:8080/api/crons/send-birthday-wishes

# Test all cron jobs at once
curl -X POST \
  -H "X-CRON-DEV-KEY: local-dev-secret" \
  -H "Content-Type: application/json" \
  http://localhost:8080/api/crons/run-all
```

##### Option B: Using Environment Variable Method
```bash
# Set the environment variable
export ALLOW_LOCAL_CRON=true

# Then test without authentication headers
curl -X POST \
  -H "Content-Type: application/json" \
  http://localhost:8080/api/crons/mark-absentee
```

#### 4. Using Postman for Local Testing

Create a Postman collection with the following configuration:

```json
{
  "info": {
    "name": "SAMS Local CRON Testing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collections.json"
  },
  "item": [
    {
      "name": "Mark Absentee - Local Dev",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "X-CRON-DEV-KEY",
            "value": "local-dev-secret"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:8080/api/crons/mark-absentee",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "crons", "mark-absentee"]
        }
      }
    },
    {
      "name": "Send Daily Summary - Local Dev",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "X-CRON-DEV-KEY",
            "value": "local-dev-secret"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:8080/api/crons/send-daily-summary",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "crons", "send-daily-summary"]
        }
      }
    },
    {
      "name": "Auto Checkout - Local Dev",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "X-CRON-DEV-KEY",
            "value": "local-dev-secret"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:8080/api/crons/auto-checkout",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "crons", "auto-checkout"]
        }
      }
    },
    {
      "name": "Send Birthday Wishes - Local Dev",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "X-CRON-DEV-KEY",
            "value": "local-dev-secret"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:8080/api/crons/send-birthday-wishes",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "crons", "send-birthday-wishes"]
        }
      }
    },
    {
      "name": "Run All CRON Jobs - Local Dev",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "X-CRON-DEV-KEY",
            "value": "local-dev-secret"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:8080/api/crons/run-all",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "crons", "run-all"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8080"
    },
    {
      "key": "cron_dev_secret",
      "value": "local-dev-secret"
    }
  ]
}
```

#### 5. Testing via Scripts

Create a local test script to run cron jobs programmatically:

```javascript
// test-cron-locally.js
const axios = require('axios');

const BASE_URL = 'http://localhost:8080';
const CRON_DEV_KEY = 'local-dev-secret';

async function testCronJob(endpoint, jobName) {
  try {
    console.log(`\nTesting ${jobName}...`);
    
    const response = await axios.post(
      `${BASE_URL}/api/crons/${endpoint}`,
      {},
      {
        headers: {
          'X-CRON-DEV-KEY': CRON_DEV_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`${jobName} completed successfully:`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(`${jobName} failed:`);
    console.error(error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('Starting local CRON job tests...');
  
  await testCronJob('mark-absentee', 'Absentee Marking');
  await testCronJob('send-daily-summary', 'Daily Summary');
  await testCronJob('auto-checkout', 'Auto Checkout');
  await testCronJob('send-birthday-wishes', 'Birthday Wishes');
  
  console.log('\nAll tests completed!');
}

// Run tests
runAllTests().catch(console.error);
```

To execute the script:
```bash
# Install axios if not already installed
npm install axios

# Run the test script
node test-cron-locally.js
```

#### 6. Direct Logic Testing for Development

You can also test the business logic directly without going through HTTP endpoints:

```javascript
// direct-logic-test.js
const { markAbsenteeLogic } = require('./src/jobs/absentee.logic');
const { sendDailySummaryLogic } = require('./src/jobs/summary.logic');
const { autoCheckoutLogic } = require('./src/jobs/autoCheckout.logic');
const { runBirthdayNotifications } = require('./src/jobs/birthday.logic');

async function testDirectLogic() {
  console.log('Testing direct logic functions...');
  
  try {
    // Test absentee logic
    console.log('\nTesting absentee logic...');
    const absenteeResult = await markAbsenteeLogic();
    console.log('Absentee result:', absenteeResult);
    
    // Test daily summary logic
    console.log('\nTesting daily summary logic...');
    const summaryResult = await sendDailySummaryLogic();
    console.log('Summary result:', summaryResult);
    
    // Test auto checkout logic
    console.log('\nTesting auto checkout logic...');
    const checkoutResult = await autoCheckoutLogic();
    console.log('Checkout result:', checkoutResult);
    
    // Test birthday logic
    console.log('\nTesting birthday logic...');
    const birthdayResult = await runBirthdayNotifications();
    console.log('Birthday result:', birthdayResult);
    
  } catch (error) {
    console.error('Error in direct logic test:', error);
  }
}

// Run direct logic tests
testDirectLogic().catch(console.error);
```

#### 7. Production Testing Considerations

When testing in production-like environments, ensure you have the following configurations:

```env
# Production environment variables
NODE_ENV=production
PLATFORM=gcp
RUN_CRON=false  # Disable built-in cron jobs
CLOUD_RUN_SERVICE_URL=https://your-service-url.run.app

# For testing in production, use the same authentication method
ALLOW_LOCAL_CRON=false  # Do not allow local cron in production
CRON_DEV_SECRET=your-production-secret  # If needed for emergency testing
```

**Important**: In production environments, CRON jobs should be triggered exclusively through Google Cloud Scheduler with proper OIDC authentication. The local testing methods should only be used in development environments.

#### 8. Verification and Monitoring

After running cron jobs, verify the results by checking the CronRun collection in your database:

```javascript
// Example: Check recent cron executions
const CronRun = require('./src/models/CronRun');

async function checkRecentCronRuns() {
  const recentRuns = await CronRun.find({})
    .sort({ createdAt: -1 })
    .limit(10);
    
  console.log('Recent cron executions:');
  recentRuns.forEach(run => {
    console.log(`${run.jobName} - ${run.status} - ${run.source} - ${run.createdAt}`);
  });
}
```

This will help you confirm that your local tests are properly recorded and tracked in the system.

## Testing Examples

### Postman Collection Example
```
{
  "info": {
    "name": "SAMS CRON Testing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collections.json"
  },
  "item": [
    {
      "name": "Mark Absentee - Local Dev",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "X-CRON-DEV-KEY",
            "value": "{{cron_dev_secret}}"
          }
        ],
        "url": {
          "raw": "http://localhost:8080/api/crons/mark-absentee",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "crons", "mark-absentee"]
        }
      }
    }
  ]
}
```

### Jest Test Example
```javascript
// test/cron-logic.test.js
const { markAbsenteeLogic } = require('../src/jobs/absentee.logic');

describe('Cron Logic Tests', () => {
  test('should mark absent employees correctly', async () => {
    const result = await markAbsenteeLogic();
    expect(result.absentees).toBeGreaterThanOrEqual(0);
    expect(result.date).toBeDefined();
  });
});
```

## CronRun Tracking

All executions are tracked in the CronRun model with source information:
- `source: 'google-scheduler'` - Production executions
- `source: 'local-dev'` - Development/local executions
- `source: 'test'` - Test executions (if applicable)

This enables monitoring and auditing of all CRON job executions regardless of source.