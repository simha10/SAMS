const express = require('express');
const router = express.Router();
const { 
  getActiveAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, restrictTo } = require('../middleware/auth');

console.log("=== REGISTERING ANNOUNCEMENT ROUTES ===");

// Public routes
router.get('/', getActiveAnnouncements);
router.get('/:id', getAnnouncementById);

// Protected routes - manager and director only
router.post('/', protect, restrictTo('manager', 'director'), createAnnouncement);
router.put('/:id', protect, restrictTo('manager', 'director'), updateAnnouncement);
router.delete('/:id', protect, restrictTo('manager', 'director'), deleteAnnouncement);

console.log("=== ANNOUNCEMENT ROUTES REGISTERED ===");

module.exports = router;