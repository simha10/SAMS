const express = require('express');
const router = express.Router();
const { createLeaveRequest, getMyLeaveRequests, cancelLeaveRequest } = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');

// Employee routes
router.post('/', protect, createLeaveRequest);
router.get('/me', protect, getMyLeaveRequests);
router.delete('/:id', protect, cancelLeaveRequest);

module.exports = router;