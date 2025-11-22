const express = require('express');
const router = express.Router();
const { getTodayBirthdays, getUpcomingBirthdays } = require('../controllers/birthdayController');
const { protect } = require('../middleware/auth');

// All birthday routes require authentication
router.use(protect);

// GET /api/birthdays/today - Get today's birthdays
router.get('/today', getTodayBirthdays);

// GET /api/birthdays/upcoming - Get upcoming birthdays (next 7 days by default)
router.get('/upcoming', getUpcomingBirthdays);

module.exports = router;
