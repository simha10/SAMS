const express = require('express');
const router = express.Router();
const { generateReport, previewReport, getMyReports, downloadReport, deleteReport } = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');

// Report routes
router.post('/', protect, generateReport);
router.post('/preview', protect, previewReport);
router.get('/my', protect, getMyReports);
router.get('/:id/download', protect, downloadReport);
router.delete('/:id', protect, deleteReport); // Add delete route

module.exports = router;