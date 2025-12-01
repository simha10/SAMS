const express = require('express');
const router = express.Router();
const {
    getActiveBranches,
    createBranch,
    updateBranch,
    deleteBranch
} = require('../controllers/branchController');
const { protect } = require('../middleware/auth');

console.log("=== REGISTERING BRANCH ROUTES ===");

// Add logging middleware for branch routes
router.use((req, res, next) => {
    console.log("=== BRANCH ROUTE REQUEST ===");
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("IP:", req.ip);
    console.log("User:", req.user?.empId || 'Not authenticated');
    console.log("Timestamp:", new Date().toISOString());
    console.log("=== END BRANCH ROUTE REQUEST ===");
    next();
});

// Protected routes
router.get('/', protect, getActiveBranches);
router.post('/', protect, createBranch);
router.put('/:id', protect, updateBranch);
router.delete('/:id', protect, deleteBranch);

console.log("=== BRANCH ROUTES REGISTERED ===");

module.exports = router;