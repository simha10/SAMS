const Branch = require('../models/Branch');
const { haversine } = require('../utils/haversine');

// Get all active branches
async function getActiveBranches(req, res) {
    try {
        const branches = await Branch.find({ isActive: true });
        res.json({
            success: true,
            data: {
                branches,
                total: branches.length
            }
        });
    } catch (error) {
        console.error('Get branches error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// Find nearest branch to a given location
async function findNearestBranch(lat, lng) {
    try {
        // Get all active branches
        const branches = await Branch.find({ isActive: true });

        if (branches.length === 0) {
            return null;
        }

        let nearestBranch = null;
        let minDistance = Infinity;

        // Find the nearest branch within its radius
        for (const branch of branches) {
            const distance = haversine(
                lat,
                lng,
                branch.location.lat,
                branch.location.lng
            );

            // Check if within branch radius and closer than current nearest
            if (distance <= branch.radius && distance < minDistance) {
                minDistance = distance;
                nearestBranch = {
                    branch,
                    distance
                };
            }
        }

        return nearestBranch;
    } catch (error) {
        console.error('Find nearest branch error:', error);
        return null;
    }
}

// Create a new branch (managers and directors)
async function createBranch(req, res) {
    try {
        // Check if user is manager or director
        if (req.user.role !== 'manager' && req.user.role !== 'director') {
            return res.status(403).json({
                success: false,
                message: 'Only managers and directors can create branches'
            });
        }

        const { name, location, radius, isActive } = req.body;

        // Validate required fields
        if (!name || !location || !location.lat || !location.lng) {
            return res.status(400).json({
                success: false,
                message: 'Name and location (lat/lng) are required'
            });
        }

        // Create new branch
        const branch = new Branch({
            name,
            location,
            radius: radius || 50, // Default to 50 meters
            isActive: isActive !== undefined ? isActive : true
        });

        await branch.save();

        res.status(201).json({
            success: true,
            message: 'Branch created successfully',
            data: {
                branch
            }
        });
    } catch (error) {
        console.error('Create branch error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// Update a branch (managers and directors)
async function updateBranch(req, res) {
    try {
        // Check if user is manager or director
        if (req.user.role !== 'manager' && req.user.role !== 'director') {
            return res.status(403).json({
                success: false,
                message: 'Only managers and directors can update branches'
            });
        }

        const { id } = req.params;
        const { name, location, radius, isActive } = req.body;

        // Find branch
        const branch = await Branch.findById(id);
        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // Update fields if provided
        if (name) branch.name = name;
        if (location) branch.location = location;
        if (radius !== undefined) branch.radius = radius;
        if (isActive !== undefined) branch.isActive = isActive;

        await branch.save();

        res.json({
            success: true,
            message: 'Branch updated successfully',
            data: {
                branch
            }
        });
    } catch (error) {
        console.error('Update branch error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// Delete a branch (managers and directors)
async function deleteBranch(req, res) {
    try {
        // Check if user is manager or director
        if (req.user.role !== 'manager' && req.user.role !== 'director') {
            return res.status(403).json({
                success: false,
                message: 'Only managers and directors can delete branches'
            });
        }

        const { id } = req.params;

        // Find branch
        const branch = await Branch.findById(id);
        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // Delete branch
        await Branch.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Branch deleted successfully'
        });
    } catch (error) {
        console.error('Delete branch error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports = {
    getActiveBranches,
    findNearestBranch,
    createBranch,
    updateBranch,
    deleteBranch
};