const express = require('express');
const router = express.Router();
const {
  verifyCronRequest,
  markAbsentee,
  sendDailySummary,
  autoCheckout,
  sendBirthdayWishes,
  cronHealthCheck
} = require('../controllers/cronController');

// Health check endpoint for cron jobs
router.get('/health', cronHealthCheck);

// Daily absentee marking endpoint - triggered by Cloud Scheduler
router.post('/mark-absentee', verifyCronRequest, markAbsentee);

// Daily summary report endpoint - triggered by Cloud Scheduler
router.post('/send-daily-summary', verifyCronRequest, sendDailySummary);

// Auto checkout endpoint - triggered by Cloud Scheduler
router.post('/auto-checkout', verifyCronRequest, autoCheckout);

// Birthday notifications endpoint - triggered by Cloud Scheduler
router.post('/send-birthday-wishes', verifyCronRequest, sendBirthdayWishes);

// Combined cron endpoint that can trigger all jobs (for testing/backup)
// This should only be used in emergency situations
router.post('/run-all', verifyCronRequest, async (req, res) => {
  try {
    const results = {};
    
    // Run all cron jobs and collect results
    try {
      const absenteeResult = await require('../controllers/cronController').markAbsentee(req, {
        ...res,
        json: (data) => { results.absentee = data; }
      });
    } catch (error) {
      results.absentee = { success: false, error: error.message };
    }
    
    try {
      const summaryResult = await require('../controllers/cronController').sendDailySummary(req, {
        ...res,
        json: (data) => { results.summary = data; }
      });
    } catch (error) {
      results.summary = { success: false, error: error.message };
    }
    
    try {
      const checkoutResult = await require('../controllers/cronController').autoCheckout(req, {
        ...res,
        json: (data) => { results.checkout = data; }
      });
    } catch (error) {
      results.checkout = { success: false, error: error.message };
    }
    
    try {
      const birthdayResult = await require('../controllers/cronController').sendBirthdayWishes(req, {
        ...res,
        json: (data) => { results.birthday = data; }
      });
    } catch (error) {
      results.birthday = { success: false, error: error.message };
    }
    
    return res.status(200).json({
      success: true,
      message: 'All cron jobs executed',
      results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error running all cron jobs',
      error: error.message
    });
  }
});

module.exports = router;