# Cron Jobs Refactoring - Execution Control

This document describes the refactoring of cron jobs to be execution-controlled using an environment flag.

## Overview

Cron jobs have been refactored to allow environment-based control without changing production behavior. This enables:
- **Render**: Cron jobs run automatically (RUN_CRON=true)
- **Cloud Run**: Cron jobs disabled (RUN_CRON=false), use Cloud Scheduler instead

## Changes Made

### 1. Refactored Cron Job Files

All cron job files now export a `start*Job()` function that wraps the cron.schedule calls:

#### `backend/src/jobs/daily.js`
- **Function**: `startDailyJob()`
- **Cron Jobs**:
  - `'0 11 * * *'` - Mark absentees at 11:00 AM daily
  - `'30 18 * * *'` - Send daily summary at 6:30 PM
- **Exports**: `{ startDailyJob }`

#### `backend/src/jobs/autoCheckout.js`
- **Function**: `startAutoCheckoutJob()`
- **Cron Job**: `'59 23 * * *'` - Auto checkout at 11:59 PM IST (with timezone: "Asia/Kolkata")
- **Fix**: Added missing `redisClient` import from `../config/redis`
- **Exports**: `{ startAutoCheckoutJob }`

#### `backend/src/jobs/birthdayNotifications.js`
- **Function**: `startBirthdayNotificationsJob()`
- **Cron Job**: `'0 8 * * *'` - Send birthday notifications at 8:00 AM daily
- **Note**: `runBirthdayNotifications` function still exported for testing
- **Exports**: `{ runBirthdayNotifications, startBirthdayNotificationsJob }`

### 2. Created `backend/src/jobs/startCrons.js`

New centralized file that:
- Imports all `start*Job` functions
- Checks `RUN_CRON` environment variable
- Starts all cron jobs if `RUN_CRON === 'true'`
- Logs appropriate messages based on configuration

### 3. Updated `backend/src/server.js`

**Before**:
```javascript
require('./jobs/daily');
require('./jobs/autoCheckout');
require('./jobs/birthdayNotifications');
```

**After**:
```javascript
const { startCrons } = require('./jobs/startCrons');
startCrons();
```

## Cron Expressions Preserved

All cron expressions remain **unchanged**:

| Job | Expression | Schedule | Timezone |
|-----|-----------|----------|----------|
| Daily Absentee Marking | `'0 11 * * *'` | 11:00 AM daily | Server timezone |
| Daily Summary | `'30 18 * * *'` | 6:30 PM daily | Server timezone |
| Auto Checkout | `'59 23 * * *'` | 11:59 PM daily | Asia/Kolkata (IST) |
| Birthday Notifications | `'0 8 * * *'` | 8:00 AM daily | Server timezone |

## Environment Configuration

### Render (Production)
Set in Render environment variables:
```env
RUN_CRON=true
```

### Cloud Run (Future)
Set in Cloud Run environment variables:
```env
RUN_CRON=false
```

### Development
Default behavior (if not set):
- Cron jobs will **NOT** run (safe default)
- Set `RUN_CRON=true` in `.env` to enable during development

## Behavior Validation

### With RUN_CRON=true
- ✅ All cron jobs start automatically
- ✅ Behavior is **IDENTICAL** to previous implementation
- ✅ No logic, timing, or data behavior changes

### With RUN_CRON=false (or not set)
- ✅ API server runs normally
- ✅ Cron jobs do **NOT** start
- ✅ No cron-related errors or warnings
- ✅ Logs indicate cron jobs are disabled

## Testing

### Existing Tests
- ✅ `birthdayNotification.test.js` still works
- ✅ Uses `runBirthdayNotifications()` function (still exported)
- ✅ No test changes required

### Manual Testing

**Test with RUN_CRON=true**:
```bash
export RUN_CRON=true
npm start
# Check logs: "=== STARTING CRON JOBS ==="
# Verify cron jobs are scheduled
```

**Test with RUN_CRON=false**:
```bash
export RUN_CRON=false
npm start
# Check logs: "=== CRON JOBS DISABLED ==="
# Verify API works but cron jobs don't run
```

## Files Modified

1. ✅ `backend/src/jobs/daily.js` - Wrapped cron schedules in `startDailyJob()`
2. ✅ `backend/src/jobs/autoCheckout.js` - Wrapped cron schedule in `startAutoCheckoutJob()`, added redisClient import
3. ✅ `backend/src/jobs/birthdayNotifications.js` - Wrapped cron schedule in `startBirthdayNotificationsJob()`
4. ✅ `backend/src/jobs/startCrons.js` - **NEW** - Centralized cron job starter
5. ✅ `backend/src/server.js` - Updated to use `startCrons()` instead of direct requires

## Backward Compatibility

- ✅ All cron expressions preserved exactly
- ✅ All job logic unchanged
- ✅ Test files continue to work
- ✅ Production behavior identical when RUN_CRON=true

## Next Steps

This refactoring prepares the system for Cloud Scheduler integration:
1. ✅ Cron jobs can be disabled in Cloud Run
2. ✅ Individual job functions can be called directly
3. ✅ Cloud Scheduler can invoke job functions via HTTP endpoints (future)

## Important Notes

- **No Cloud Scheduler implementation yet** - This is a safety refactor only
- **Render must set RUN_CRON=true** to maintain current behavior
- **Default is disabled** - Prevents accidental cron execution in new environments
- **All cron logic unchanged** - Only execution control added

