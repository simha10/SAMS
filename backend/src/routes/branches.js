const express = require('express');
const router = express.Router();
const {
  getAllBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch
} = require('../controllers/branchController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET /api/branches - Get all branches (all users)
router.get('/', getAllBranches);

// GET /api/branches/:id - Get branch by ID or code (all users)
router.get('/:id', getBranch);

// POST /api/branches - Create branch (director only)
router.post('/', restrictTo('director'), createBranch);

// PUT /api/branches/:id - Update branch (director only)
router.put('/:id', restrictTo('director'), updateBranch);

// DELETE /api/branches/:id - Soft delete branch (director only)
router.delete('/:id', restrictTo('director'), deleteBranch);

module.exports = router;
