# Multi-Branch Attendance System Migration Guide

## Overview

This document describes the migration process from the legacy single-office geofencing system to the new multi-branch attendance system in a production environment without data loss or service interruption.

## Migration Goals

1. **Preserve existing data** - No user or attendance data should be lost
2. **Maintain system availability** - System should continue to operate during migration
3. **Enable new functionality** - Multi-branch support should be fully functional
4. **Ensure backward compatibility** - Existing integrations should continue to work

## Migration Process

### Phase 1: Assessment

Before migration, the system assessed:
- 5 users with existing `officeLocation` data
- 0 existing branches (branches needed to be created)
- Production system in active use

### Phase 2: Branch Creation

The migration script automatically created branches from existing user data:
- **Old Office Branch**: 26.913662872166825, 80.95351830268484 (50m radius)
- **New Office Branch**: 26.914835918849107, 80.94982919387432 (50m radius)

### Phase 3: System Transition

The system was updated to:
1. Keep existing `officeLocation` data for backward compatibility
2. Use the new Branch model for geofencing
3. Maintain dual compatibility during transition period

## Files Modified

### Backend Changes
- `backend/src/models/User.js` - Added deprecation notice for `officeLocation`
- `backend/src/controllers/attendanceController.js` - Already using multi-branch logic
- `backend/src/controllers/branchController.js` - Multi-branch logic intact

### Scripts Created
- `backend/scripts/migrate-users.js` - Main migration script
- `backend/scripts/verify-migration.js` - Verification script
- `backend/scripts/rollback-migration.js` - Rollback procedure
- `backend/scripts/check-data.js` - Data assessment tool

## Verification Results

After migration:
- ✅ 5 users with preserved `officeLocation` data
- ✅ 2 active branches created from user data
- ✅ Multi-branch system fully operational
- ✅ No data loss detected
- ✅ System ready for production use

## Rollback Procedure

If issues arise, the system can be rolled back using:
```bash
cd backend
node scripts/rollback-migration.js
```

The rollback preserves all data and maintains system functionality.

## Future Cleanup

In a future release (after confirming stable operation), the `officeLocation` field can be:
1. Marked as deprecated in documentation
2. Gradually phased out of the codebase
3. Eventually removed in a major version update

## Best Practices Applied

1. **Zero Downtime** - Migration performed while system remained operational
2. **Data Preservation** - All existing data maintained
3. **Gradual Transition** - Dual system support during transition
4. **Verification** - Comprehensive validation after migration
5. **Rollback Capability** - Safe recovery procedures available
6. **Documentation** - Clear process documentation provided

## Testing Recommendations

Post-migration testing should verify:
1. User login functionality
2. Attendance check-in/out at both branches
3. Geofencing accuracy
4. Manager dashboard functionality
5. Report generation
6. Notification system

## Support

For issues with the migration, contact the development team with:
1. Migration script output
2. Error messages encountered
3. System behavior observations