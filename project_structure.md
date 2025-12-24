# 📁 SAMS - Project Structure

. 📂 SAMS
├── 📄 CHANGELOG.md
└── 📂 DOCS/
│  ├── 📄 CHANGELOG_SUMMARY.md
│  ├── 📄 GEOLOCATION.md
│  ├── 📄 PERFORMANCE.md
│  ├── 📄 RECENT_FIXES.md
│  ├── 📄 TROUBLESHOOTING.md
├── 📄 README.md
└── 📂 backend/
│  ├── 📄 README.md
│  └── 📂 __tests__/
│    ├── 📄 attendance.test.js
│    ├── 📄 attendanceExtended.test.js
│    ├── 📄 birthdayNotification.test.js
│    ├── 📄 branch.test.js
│    ├── 📄 excelStreaming.test.js
│    ├── 📄 holidayExtended.test.js
│    ├── 📄 holidayRules.test.js
│    ├── 📄 leave.test.js
│    ├── 📄 multiBranchAttendance.test.js
│    ├── 📄 reportStreaming.test.js
│    ├── 📄 user.test.js
│    ├── 📄 userExtended.test.js
│    ├── 📄 userModel.test.js
│    ├── 📄 validation.test.js
│    ├── 📄 workingHoursRule.test.js
│  ├── 📄 jest.config.js
│  └── 📂 load-tests/
│    ├── 📄 report-streaming-test.yaml
│  ├── 📄 package-lock.json
│  ├── 📄 package.json
│  └── 📂 scripts/
│    ├── 📄 bulkCheckout.js
│    ├── 📄 check-data.js
│    ├── 📄 clear-auth-cache.js
│    ├── 📄 clear-redis-sessions.js
│    ├── 📄 debug-attendance.js
│    ├── 📄 diagnoseAttendance.js
│    ├── 📄 list-branches.js
│    ├── 📄 list-users.js
│    ├── 📄 reset-todays-attendance.js
│    ├── 📄 seed-users.js
│    ├── 📄 simple-login-test.js
│    ├── 📄 test-persistent-login.js
│    ├── 📄 test-redis.js
│  └── 📂 src/
│    ├── 📄 App.js
│    └── 📂 config/
│      ├── 📄 database.js
│      ├── 📄 logger.js
│      ├── 📄 redis.js
│    └── 📂 controllers/
│      ├── 📄 adminController.js
│      ├── 📄 announcementController.js
│      ├── 📄 attendanceController.js
│      ├── 📄 authController.js
│      ├── 📄 branchController.js
│      ├── 📄 detailedReportController.js
│      ├── 📄 holidayController.js
│      ├── 📄 leaveController.js
│      ├── 📄 managerController.js
│      ├── 📄 reportController.js
│    └── 📂 jobs/
│      ├── 📄 autoCheckout.js
│      ├── 📄 birthdayNotifications.js
│      ├── 📄 daily.js
│    └── 📂 middleware/
│      ├── 📄 auth.js
│      ├── 📄 cache.js
│      ├── 📄 redisRateLimiter.js
│    └── 📂 models/
│      ├── 📄 Announcement.js
│      ├── 📄 Attendance.js
│      ├── 📄 Branch.js
│      ├── 📄 Holiday.js
│      ├── 📄 LeaveRequest.js
│      ├── 📄 Report.js
│      ├── 📄 User.js
│    └── 📂 routes/
│      ├── 📄 admin.js
│      ├── 📄 announcements.js
│      ├── 📄 attendance.js
│      ├── 📄 auth.js
│      ├── 📄 branches.js
│      ├── 📄 detailedReports.js
│      ├── 📄 holidays.js
│      ├── 📄 leaves.js
│      ├── 📄 manager.js
│      ├── 📄 publicHolidays.js
│      ├── 📄 reports.js
│    ├── 📄 server.js
│    └── 📂 utils/
│      ├── 📄 dateUtils.js
│      ├── 📄 detailedAttendanceReport.js
│      ├── 📄 excel.js
│      ├── 📄 excelStreaming.js
│      ├── 📄 haversine.js
│      ├── 📄 pdfGenerator.js
│      ├── 📄 tokenUtils.js
│      ├── 📄 validation.js
│  └── 📂 tests/
└── 📂 dev-dist/
├── 📄 ecosystem.frontend.config.js
├── 📄 eslint.config.js
├── 📄 index.html
├── 📄 package-lock.json
├── 📄 package.json
├── 📄 postcss.config.cjs
├── 📄 project_structure.md
└── 📂 public/
│  ├── 📄 apple-touch-icon.png
│  ├── 📄 favicon.ico
│  ├── 📄 logo192.png
│  ├── 📄 logo512.png
│  ├── 📄 manifest.webmanifest
│  ├── 📄 masked-icon.svg
│  ├── 📄 under maintanance.mp4
│  ├── 📄 vite.svg
└── 📂 src/
│  ├── 📄 App.css
│  ├── 📄 App.tsx
│  └── 📂 assets/
│    ├── 📄 react.svg
│    ├── 📄 sidebarbg.jpg
│  └── 📂 components/
│    ├── 📄 AnnouncementModal.tsx
│    ├── 📄 Announcements.tsx
│    ├── 📄 AttendanceConfirmationDialog.tsx
│    ├── 📄 DeleteEmployeeModal.tsx
│    ├── 📄 EditEmployeeModal.tsx
│    ├── 📄 Maintenance.tsx
│    ├── 📄 ReportPreview.tsx
│    ├── 📄 ThemeToggle.tsx
│    └── 📂 ui/
│      ├── 📄 accordion.tsx
│      ├── 📄 alert-dialog.tsx
│      ├── 📄 alert.tsx
│      ├── 📄 aspect-ratio.tsx
│      ├── 📄 avatar.tsx
│      ├── 📄 badge.tsx
│      ├── 📄 breadcrumb.tsx
│      ├── 📄 button.tsx
│      ├── 📄 calendar.tsx
│      ├── 📄 card.tsx
│      ├── 📄 carousel.tsx
│      ├── 📄 chart.tsx
│      ├── 📄 checkbox.tsx
│      ├── 📄 collapsible-sidebar.tsx
│      ├── 📄 collapsible.tsx
│      ├── 📄 command.tsx
│      ├── 📄 context-menu.tsx
│      ├── 📄 dialog.tsx
│      ├── 📄 drawer.tsx
│      ├── 📄 dropdown-menu.tsx
│      ├── 📄 form.tsx
│      ├── 📄 hover-card.tsx
│      ├── 📄 input-otp.tsx
│      ├── 📄 input.tsx
│      ├── 📄 label.tsx
│      ├── 📄 menubar.tsx
│      ├── 📄 navigation-menu.tsx
│      ├── 📄 pagination.tsx
│      ├── 📄 popover.tsx
│      ├── 📄 radio-group.tsx
│      ├── 📄 resizable.tsx
│      ├── 📄 scroll-area.tsx
│      ├── 📄 select.tsx
│      ├── 📄 separator.tsx
│      ├── 📄 sheet.tsx
│      ├── 📄 sidebar.tsx
│      ├── 📄 skeleton.tsx
│      ├── 📄 slider.tsx
│      ├── 📄 sonner.tsx
│      ├── 📄 switch.tsx
│      ├── 📄 table.tsx
│      ├── 📄 tabs.tsx
│      ├── 📄 textarea.tsx
│      ├── 📄 toast.tsx
│      ├── 📄 toaster.tsx
│      ├── 📄 toggle-group.tsx
│      ├── 📄 toggle.tsx
│      ├── 📄 tooltip.tsx
│      ├── 📄 use-toast.ts
│  ├── 📄 config.ts
│  └── 📂 hooks/
│    ├── 📄 use-mobile.tsx
│    ├── 📄 use-toast.ts
│    ├── 📄 useAnnouncementModal.ts
│    ├── 📄 useAnnouncements.ts
│    ├── 📄 useBranches.ts
│    ├── 📄 useGeolocation.ts
│    ├── 📄 usePWA.ts
│  ├── 📄 index.css
│  └── 📂 layouts/
│    ├── 📄 AdminManagerLayout.tsx
│    ├── 📄 EmployeeLayout.tsx
│  └── 📂 lib/
│    ├── 📄 utils.ts
│  ├── 📄 main.tsx
│  └── 📂 pages/
│    ├── 📄 AdminAttendanceLogs.tsx
│    ├── 📄 AdminDashboard.tsx
│    ├── 📄 Index.tsx
│    ├── 📄 Login.tsx
│    └── 📂 Manager/
│      ├── 📄 AddEmployee.tsx
│      ├── 📄 Announcements.tsx
│      ├── 📄 Attendance.tsx
│      ├── 📄 AttendanceApprovals.tsx
│      ├── 📄 BranchManagement.tsx
│      ├── 📄 Holidays.tsx
│      ├── 📄 LeaveApprovals.tsx
│      ├── 📄 Profile.tsx
│      ├── 📄 Reports.tsx
│    ├── 📄 NotFound.tsx
│    └── 📂 employee/
│      ├── 📄 Announcements.tsx
│      ├── 📄 ApplyLeave.tsx
│      ├── 📄 Attendance.tsx
│      ├── 📄 Dashboard.tsx
│      ├── 📄 History.tsx
│      ├── 📄 Profile.tsx
│      ├── 📄 Requests.tsx
│  ├── 📄 service-worker.ts
│  └── 📂 services/
│    ├── 📄 api.ts
│  └── 📂 stores/
│    ├── 📄 attendanceStore.ts
│    ├── 📄 authStore.ts
│    ├── 📄 birthdayStore.ts
│  ├── 📄 test-pwa.ts
│  └── 📂 types/
│    ├── 📄 index.ts
│  └── 📂 utils/
│    ├── 📄 attendanceCache.ts
│    ├── 📄 branchCache.ts
│    ├── 📄 haversine.ts
│    ├── 📄 profileCache.ts
├── 📄 tailwind.config.cjs
├── 📄 toggle-group.tsx
├── 📄 tsconfig.app.json
├── 📄 tsconfig.json
├── 📄 tsconfig.node.json
└── 📄 vite.config.ts
```