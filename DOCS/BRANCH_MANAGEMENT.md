# Branch Management Feature

## Overview
This feature allows directors to manage multiple office branches for attendance tracking. Employees can mark their attendance from any active branch location.

## Features Implemented

### 1. Branch Management Page
- **Access**: Only directors can access this page
- **Functionality**:
  - Add new branches with name, location (latitude/longitude), and radius
  - Edit existing branches
  - Delete branches
  - View all branches with their details
  - Toggle branch active/inactive status

### 2. Enhanced Add Employee Page
- **Access**: Managers and directors
- **Functionality**:
  - Directors can optionally assign employees to specific branches (UI only, not enforced)
  - Standard employee registration form with validation

### 3. Backend API Endpoints
- `GET /api/branches` - Get all active branches
- `POST /api/branches` - Create a new branch (directors only)
- `PUT /api/branches/:id` - Update a branch (directors only)
- `DELETE /api/branches/:id` - Delete a branch (directors only)

## Data Models

### Branch Model
```javascript
{
  _id: String,
  name: String,
  location: {
    lat: Number,
    lng: Number
  },
  radius: Number, // Default: 50 meters
  isActive: Boolean, // Default: true
  createdAt: Date,
  updatedAt: Date
}
```

### User Model Updates
- No structural changes needed
- Users can check in from any active branch
- Branch assignment is optional and for administrative purposes only

## Frontend Components

### BranchManagement.tsx
- Located in `/src/pages/Manager/BranchManagement.tsx`
- Provides CRUD operations for branches
- Role-based access control (directors only)

### AddEmployee.tsx Updates
- Added branch selection dropdown for directors
- Maintains backward compatibility with existing functionality

### UI Enhancements
- Added "Branch Management" link to sidebar (directors only)
- Improved form validation and error handling
- Responsive design for all screen sizes

## Security Considerations
- Only directors can create, update, or delete branches
- All branch operations are protected by authentication
- Proper error handling and validation on both frontend and backend

## Usage Instructions

### For Directors
1. Navigate to "Branch Management" in the sidebar
2. Add new branches by filling in the required information:
   - Branch name
   - Latitude and longitude coordinates
   - Radius (optional, defaults to 50 meters)
   - Active status (optional, defaults to active)
3. Edit or delete existing branches as needed
4. Assign employees to branches during employee registration (optional)

### For Managers
1. Navigate to "Add Employee" in the sidebar
2. Fill in employee details as usual
3. Optionally select a branch for the employee (for administrative tracking)

### For Employees
- Employees can check in from any active branch location
- The system automatically determines the nearest valid branch during check-in
- No manual branch selection required during daily attendance

## Technical Implementation Details

### Frontend
- React components with TypeScript
- Integration with existing API services
- Form validation and error handling
- Responsive UI with Tailwind CSS
- Role-based access control

### Backend
- RESTful API endpoints
- Mongoose models for data persistence
- Authentication and authorization middleware
- Input validation and sanitization

## Future Enhancements
- Branch-specific reporting
- Geofence visualization on map
- Bulk branch import/export
- Branch hierarchy and relationships