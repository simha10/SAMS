const express = require('express');
const router = express.Router();
const { 
  isHoliday
} = require('../controllers/holidayController');
const { protect } = require('../middleware/auth');

// Public routes (accessible to all authenticated users)
router.get('/check', protect, isHoliday);

module.exports = router;