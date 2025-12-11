# Changelog

All notable changes to the Geo-Fence Attendance Management System (SAMS) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-11

### Added
- Multi-Branch Attendance System
  - New Branch model with name, location, radius, and isActive fields
  - Employees can check in from any company branch location
  - Distance calculation from branch during check-in
  - Branch management UI for Directors
- Enhanced Dashboard UI
  - Completely redesigned Manager/Director dashboard with role-specific layouts
  - Unified header layout across all dashboard pages
  - Improved mobile responsiveness and user experience
- Birthday Notification System
  - Added date of birth (dob) field to User model
  - Daily cron job at 8:00 AM to scan for birthdays
  - Team notifications for birthdays with celebration banners
  - Birthday store for frontend state management
- Industrial-Grade Rate Limiting
  - Redis-based distributed rate limiting for scalability
  - Sliding window algorithm for accurate rate limiting
  - Granular rate limiting based on endpoint sensitivity
- Distributed Caching
  - Redis caching for frequently accessed data
  - Improved performance for high-traffic endpoints
- Database Connection Pooling
  - Optimized database connections for better resource utilization
- Advanced Flagged Attendance
  - Detailed reasons with precise distance reporting
  - Distance information included in manager dashboard views
  - Distance data included in CSV/Excel reports
- Enhanced Holiday Management
  - All Sundays automatically treated as holidays
  - Custom holiday declarations by Managers
  - Recurring Sunday support with isRecurringSunday field
- Persistent Login Sessions
  - "Remember Me" functionality for extended sessions
  - 7-day token expiration for persistent logins
- Detailed Reporting
  - Enhanced CSV/Excel reports with branch and distance information
  - Detailed attendance reports with comprehensive data
- New API Endpoints
  - Branch management endpoints for Directors
  - Enhanced dashboard endpoints for Manager/Director roles
  - Detailed report generation endpoints

### Changed
- Attendance Time Rules
  - Full attendance marking allowed anytime between 12:01 AM and 11:59 PM
  - Half-day threshold changed from 4 hours to 5 hours
  - Clean attendance between 9 AM to 7 PM unless holiday/Sunday
- User Model
  - Added dob field with indexing for performance
  - Added proper validation and error handling
- Attendance Model
  - Added branch reference and distance tracking fields
  - Enhanced flaggedReason with detailed information
- Holiday Model
  - Added isRecurringSunday field for recurring Sunday support
- Security Enhancements
  - Enterprise-grade JWT authentication with HTTP-only cookies
  - Improved CORS protection with whitelist-based approach
  - Enhanced input validation with Zod schemas
- Performance Improvements
  - Optimized database queries with proper indexing
  - Connection pooling for better resource management
  - Caching strategies for frequently accessed data

### Deprecated
- Legacy single-office geofencing approach (maintained for backward compatibility)
- Old dashboard layout (preserved for transition period)

### Removed
- None (all features maintained for backward compatibility)

### Fixed
- Header alignment issues on mobile devices
- Text truncation for long user names in dashboard
- Spacing and alignment issues across dashboard pages
- Touch target sizes for better mobile usability
- Various UI inconsistencies in dashboard layouts

### Security
- Enhanced JWT token security with HTTP-only cookies
- Improved password hashing with bcrypt
- Rate limiting protection against brute force attacks
- Input sanitization to prevent injection attacks
- CORS protection with proper domain whitelisting

## [1.0.0] - 2025-11-15

### Added
- Initial release of Geo-Fence Attendance Management System
- Core attendance tracking with geofence validation
- Role-based access control (Employee, Manager, Director)
- Leave management system
- Report generation (CSV and Excel)
- Real-time notifications via Telegram/Brevo
- Automated jobs for daily absentee marking
- Flexible absent handling
- Basic dashboard UI
- JWT authentication
- MongoDB integration
- React frontend with Vite