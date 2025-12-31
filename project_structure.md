# 📁 SAMS - Project Structure

*Generated on: 12/31/2025, 10:33:13 AM*

## 📋 Quick Overview

| Metric | Value |
|--------|-------|
| 📄 Total Files | 234 |
| 📁 Total Folders | 31 |
| 🌳 Max Depth | 3 levels |
| 🛠️ Tech Stack | React, TypeScript, CSS, Node.js, Docker |

## ⭐ Important Files

- 🟡 🚫 **.gitignore** - Git ignore rules
- 🟡 🐳 **Dockerfile** - Docker container
- 🟡 🔒 **package-lock.json** - Dependency lock
- 🔴 📦 **package.json** - Package configuration
- 🔴 📖 **README.md** - Project documentation
- 🔵 📝 **CHANGELOG.md** - Change log
- 🟡 🔒 **package-lock.json** - Dependency lock
- 🔴 📦 **package.json** - Package configuration
- 🔴 📖 **README.md** - Project documentation
- 🟡 🔷 **tsconfig.json** - TypeScript config
- 🔵 ▲ **vercel.json** - Vercel config

## 📊 File Statistics

### By File Type

- 📜 **.js** (JavaScript files): 86 files (36.8%)
- ⚛️ **.tsx** (React TypeScript files): 82 files (35.0%)
- 🔷 **.ts** (TypeScript files): 21 files (9.0%)
- 📖 **.md** (Markdown files): 14 files (6.0%)
- ⚙️ **.json** (JSON files): 9 files (3.8%)
- 🖼️ **.png** (PNG images): 3 files (1.3%)
- 🎨 **.svg** (SVG images): 3 files (1.3%)
- 📄 **.example** (Other files): 2 files (0.9%)
- ⚙️ **.yaml** (YAML files): 2 files (0.9%)
- 📄 **.cjs** (Other files): 2 files (0.9%)
- 🎨 **.css** (Stylesheets): 2 files (0.9%)
- 🚫 **.gitignore** (Git ignore): 1 files (0.4%)
- 🐳 **.dockerignore** (Docker ignore): 1 files (0.4%)
- 🐳 **.dockerfile** (Docker files): 1 files (0.4%)
- 🌐 **.html** (HTML files): 1 files (0.4%)
- 🖼️ **.ico** (Icon files): 1 files (0.4%)
- 📄 **.webmanifest** (Other files): 1 files (0.4%)
- 📄 **.mp4** (Other files): 1 files (0.4%)
- 🖼️ **.jpg** (JPEG images): 1 files (0.4%)

### By Category

- **JavaScript**: 86 files (36.8%)
- **React**: 82 files (35.0%)
- **TypeScript**: 21 files (9.0%)
- **Docs**: 14 files (6.0%)
- **Config**: 11 files (4.7%)
- **Assets**: 8 files (3.4%)
- **Other**: 6 files (2.6%)
- **DevOps**: 3 files (1.3%)
- **Styles**: 2 files (0.9%)
- **Web**: 1 files (0.4%)

### 📁 Largest Directories

- **root**: 234 files
- **src**: 106 files
- **backend**: 87 files
- **src\components**: 57 files
- **src\components\ui**: 49 files

## 🌳 Directory Structure

```
SAMS/
├── 📄 .env.example
├── 🟡 🚫 **.gitignore**
├── 📂 backend/
│   ├── 🧪 __tests__/
│   │   ├── 📜 attendance.test.js
│   │   ├── 📜 attendanceExtended.test.js
│   │   ├── 📜 birthdayNotification.test.js
│   │   ├── 📜 branch.test.js
│   │   ├── 📜 excelStreaming.test.js
│   │   ├── 📜 holidayExtended.test.js
│   │   ├── 📜 holidayRules.test.js
│   │   ├── 📜 leave.test.js
│   │   ├── 📜 multiBranchAttendance.test.js
│   │   ├── 📜 reportStreaming.test.js
│   │   ├── 📜 user.test.js
│   │   ├── 📜 userExtended.test.js
│   │   ├── 📜 userModel.test.js
│   │   ├── 📜 validation.test.js
│   │   └── 📜 workingHoursRule.test.js
│   ├── 🐳 .dockerignore
│   ├── 📄 .env.example
│   ├── ⚙️ cloudbuild.yaml
│   ├── 🟡 🐳 **Dockerfile**
│   ├── 📂 exports/
│   │   └── ⚙️ users_2025-12-30T13-06-18-899Z.json
│   ├── 📜 jest.config.js
│   ├── 📂 load-tests/
│   │   └── ⚙️ report-streaming-test.yaml
│   ├── 🟡 🔒 **package-lock.json**
│   ├── 🔴 📦 **package.json**
│   ├── 🔴 📖 **README.md**
│   ├── 📂 scripts/
│   │   ├── 📜 bulkCheckout.js
│   │   ├── 📜 check-data.js
│   │   ├── 📜 clear-auth-cache.js
│   │   ├── 📜 clear-redis-sessions.js
│   │   ├── 📜 debug-attendance.js
│   │   ├── 📜 diagnoseAttendance.js
│   │   ├── 📜 export-collection.js
│   │   ├── 📜 list-branches.js
│   │   ├── 📜 list-users.js
│   │   ├── 📜 reset-todays-attendance.js
│   │   ├── 📜 seed-users.js
│   │   ├── 📜 simple-login-test.js
│   │   ├── 📜 test-persistent-login.js
│   │   └── 📜 test-redis.js
│   ├── 📁 src/
│   │   ├── 📜 App.js
│   │   ├── ⚙️ config/
│   │   │   ├── 📜 database.js
│   │   │   ├── 📜 logger.js
│   │   │   └── 📜 redis.js
│   │   ├── 📂 controllers/
│   │   │   ├── 📜 adminController.js
│   │   │   ├── 📜 announcementController.js
│   │   │   ├── 📜 attendanceController.js
│   │   │   ├── 📜 authController.js
│   │   │   ├── 📜 branchController.js
│   │   │   ├── 📜 detailedReportController.js
│   │   │   ├── 📜 holidayController.js
│   │   │   ├── 📜 leaveController.js
│   │   │   ├── 📜 managerController.js
│   │   │   └── 📜 reportController.js
│   │   ├── 📂 jobs/
│   │   │   ├── 📜 autoCheckout.js
│   │   │   ├── 📜 birthdayNotifications.js
│   │   │   ├── 📜 daily.js
│   │   │   └── 📜 startCrons.js
│   │   ├── 📂 middleware/
│   │   │   ├── 📜 auth.js
│   │   │   ├── 📜 cache.js
│   │   │   └── 📜 redisRateLimiter.js
│   │   ├── 📂 models/
│   │   │   ├── 📜 Announcement.js
│   │   │   ├── 📜 Attendance.js
│   │   │   ├── 📜 Branch.js
│   │   │   ├── 📜 Holiday.js
│   │   │   ├── 📜 LeaveRequest.js
│   │   │   ├── 📜 Report.js
│   │   │   └── 📜 User.js
│   │   ├── 📂 routes/
│   │   │   ├── 📜 admin.js
│   │   │   ├── 📜 announcements.js
│   │   │   ├── 📜 attendance.js
│   │   │   ├── 📜 auth.js
│   │   │   ├── 📜 branches.js
│   │   │   ├── 📜 detailedReports.js
│   │   │   ├── 📜 holidays.js
│   │   │   ├── 📜 leaves.js
│   │   │   ├── 📜 manager.js
│   │   │   ├── 📜 publicHolidays.js
│   │   │   └── 📜 reports.js
│   │   ├── 📜 server.js
│   │   └── 🔧 utils/
│   │   │   ├── 📜 dateUtils.js
│   │   │   ├── 📜 detailedAttendanceReport.js
│   │   │   ├── 📜 excel.js
│   │   │   ├── 📜 excelStreaming.js
│   │   │   ├── 📜 haversine.js
│   │   │   ├── 📜 pdfGenerator.js
│   │   │   ├── 📜 tokenUtils.js
│   │   │   └── 📜 validation.js
│   └── 🧪 tests/
├── 🔵 📝 **CHANGELOG.md**
├── 📂 dev-dist/
│   ├── 📜 registerSW.js
│   ├── 📜 suppress-warnings.js
│   ├── 📜 sw.js
│   ├── 📜 workbox-1cff22dc.js
│   ├── 📜 workbox-5a5d9309.js
│   └── 📜 workbox-a4de3ef2.js
├── 📖 DOCS/
│   ├── 📖 CHANGELOG_SUMMARY.md
│   ├── 📖 CRON_REFACTORING.md
│   ├── 📖 GCP_DEPLOYMENT_GUIDE.md
│   ├── 📖 GEOLOCATION.md
│   ├── 📖 PERFORMANCE.md
│   ├── 📖 RECENT_FIXES.md
│   └── 📖 TROUBLESHOOTING.md
├── 📜 ecosystem.frontend.config.js
├── 📖 errors.md
├── 📜 eslint.config.js
├── 📖 GCP_Commands.md
├── 🌐 index.html
├── 🟡 🔒 **package-lock.json**
├── 🔴 📦 **package.json**
├── 📄 postcss.config.cjs
├── 📖 project_structure.md
├── 🌐 public/
│   ├── 🖼️ apple-touch-icon.png
│   ├── 🖼️ favicon.ico
│   ├── 🖼️ logo192.png
│   ├── 🖼️ logo512.png
│   ├── 📄 manifest.webmanifest
│   ├── 🎨 masked-icon.svg
│   ├── 📄 under maintanance.mp4
│   └── 🎨 vite.svg
├── 🔴 📖 **README.md**
├── 📁 src/
│   ├── 🎨 App.css
│   ├── ⚛️ App.tsx
│   ├── 📦 assets/
│   │   ├── 🎨 react.svg
│   │   └── 🖼️ sidebarbg.jpg
│   ├── 🧩 components/
│   │   ├── ⚛️ AnnouncementModal.tsx
│   │   ├── ⚛️ Announcements.tsx
│   │   ├── ⚛️ AttendanceConfirmationDialog.tsx
│   │   ├── ⚛️ DeleteEmployeeModal.tsx
│   │   ├── ⚛️ EditEmployeeModal.tsx
│   │   ├── ⚛️ Maintenance.tsx
│   │   ├── ⚛️ ReportPreview.tsx
│   │   ├── ⚛️ ThemeToggle.tsx
│   │   └── 🎨 ui/
│   │   │   ├── ⚛️ accordion.tsx
│   │   │   ├── ⚛️ alert-dialog.tsx
│   │   │   ├── ⚛️ alert.tsx
│   │   │   ├── ⚛️ aspect-ratio.tsx
│   │   │   ├── ⚛️ avatar.tsx
│   │   │   ├── ⚛️ badge.tsx
│   │   │   ├── ⚛️ breadcrumb.tsx
│   │   │   ├── ⚛️ button.tsx
│   │   │   ├── ⚛️ calendar.tsx
│   │   │   ├── ⚛️ card.tsx
│   │   │   ├── ⚛️ carousel.tsx
│   │   │   ├── ⚛️ chart.tsx
│   │   │   ├── ⚛️ checkbox.tsx
│   │   │   ├── ⚛️ collapsible-sidebar.tsx
│   │   │   ├── ⚛️ collapsible.tsx
│   │   │   ├── ⚛️ command.tsx
│   │   │   ├── ⚛️ context-menu.tsx
│   │   │   ├── ⚛️ dialog.tsx
│   │   │   ├── ⚛️ drawer.tsx
│   │   │   ├── ⚛️ dropdown-menu.tsx
│   │   │   ├── ⚛️ form.tsx
│   │   │   ├── ⚛️ hover-card.tsx
│   │   │   ├── ⚛️ input-otp.tsx
│   │   │   ├── ⚛️ input.tsx
│   │   │   ├── ⚛️ label.tsx
│   │   │   ├── ⚛️ menubar.tsx
│   │   │   ├── ⚛️ navigation-menu.tsx
│   │   │   ├── ⚛️ pagination.tsx
│   │   │   ├── ⚛️ popover.tsx
│   │   │   ├── ⚛️ radio-group.tsx
│   │   │   ├── ⚛️ resizable.tsx
│   │   │   ├── ⚛️ scroll-area.tsx
│   │   │   ├── ⚛️ select.tsx
│   │   │   ├── ⚛️ separator.tsx
│   │   │   ├── ⚛️ sheet.tsx
│   │   │   ├── ⚛️ sidebar.tsx
│   │   │   ├── ⚛️ skeleton.tsx
│   │   │   ├── ⚛️ slider.tsx
│   │   │   ├── ⚛️ sonner.tsx
│   │   │   ├── ⚛️ switch.tsx
│   │   │   ├── ⚛️ table.tsx
│   │   │   ├── ⚛️ tabs.tsx
│   │   │   ├── ⚛️ textarea.tsx
│   │   │   ├── ⚛️ toast.tsx
│   │   │   ├── ⚛️ toaster.tsx
│   │   │   ├── ⚛️ toggle-group.tsx
│   │   │   ├── ⚛️ toggle.tsx
│   │   │   ├── ⚛️ tooltip.tsx
│   │   │   └── 🔷 use-toast.ts
│   ├── 🔷 config.ts
│   ├── 🎣 hooks/
│   │   ├── ⚛️ use-mobile.tsx
│   │   ├── 🔷 use-toast.ts
│   │   ├── 🔷 useAnnouncementModal.ts
│   │   ├── 🔷 useAnnouncements.ts
│   │   ├── 🔷 useBranches.ts
│   │   ├── 🔷 useGeolocation.ts
│   │   └── 🔷 usePWA.ts
│   ├── 🎨 index.css
│   ├── 📂 layouts/
│   │   ├── ⚛️ AdminManagerLayout.tsx
│   │   └── ⚛️ EmployeeLayout.tsx
│   ├── 📚 lib/
│   │   └── 🔷 utils.ts
│   ├── ⚛️ main.tsx
│   ├── 📄 pages/
│   │   ├── ⚛️ AdminAttendanceLogs.tsx
│   │   ├── ⚛️ AdminDashboard.tsx
│   │   ├── 📂 employee/
│   │   │   ├── ⚛️ Announcements.tsx
│   │   │   ├── ⚛️ ApplyLeave.tsx
│   │   │   ├── ⚛️ Attendance.tsx
│   │   │   ├── ⚛️ Dashboard.tsx
│   │   │   ├── ⚛️ History.tsx
│   │   │   ├── ⚛️ Profile.tsx
│   │   │   └── ⚛️ Requests.tsx
│   │   ├── ⚛️ Index.tsx
│   │   ├── ⚛️ Login.tsx
│   │   ├── 📂 Manager/
│   │   │   ├── ⚛️ AddEmployee.tsx
│   │   │   ├── ⚛️ Announcements.tsx
│   │   │   ├── ⚛️ Attendance.tsx
│   │   │   ├── ⚛️ AttendanceApprovals.tsx
│   │   │   ├── ⚛️ BranchManagement.tsx
│   │   │   ├── ⚛️ Holidays.tsx
│   │   │   ├── ⚛️ LeaveApprovals.tsx
│   │   │   ├── ⚛️ Profile.tsx
│   │   │   └── ⚛️ Reports.tsx
│   │   └── ⚛️ NotFound.tsx
│   ├── 🔷 service-worker.ts
│   ├── 📂 services/
│   │   └── 🔷 api.ts
│   ├── 📂 stores/
│   │   ├── 🔷 attendanceStore.ts
│   │   ├── 🔷 authStore.ts
│   │   └── 🔷 birthdayStore.ts
│   ├── 🔷 test-pwa.ts
│   ├── 📂 types/
│   │   └── 🔷 index.ts
│   └── 🔧 utils/
│   │   ├── 🔷 attendanceCache.ts
│   │   ├── 🔷 branchCache.ts
│   │   ├── 🔷 haversine.ts
│   │   └── 🔷 profileCache.ts
├── 📄 tailwind.config.cjs
├── 📖 TODO.md
├── ⚙️ tsconfig.app.json
├── 🟡 🔷 **tsconfig.json**
├── ⚙️ tsconfig.node.json
├── 🔵 ▲ **vercel.json**
└── 🔷 vite.config.ts
```

## 📖 Legend

### File Types
- 📄 Other: Other files
- 🚫 DevOps: Git ignore
- 🐳 DevOps: Docker ignore
- ⚙️ Config: YAML files
- 🐳 DevOps: Docker files
- ⚙️ Config: JSON files
- 📜 JavaScript: JavaScript files
- 📖 Docs: Markdown files
- 🌐 Web: HTML files
- 🖼️ Assets: PNG images
- 🖼️ Assets: Icon files
- 🎨 Assets: SVG images
- 🎨 Styles: Stylesheets
- ⚛️ React: React TypeScript files
- 🖼️ Assets: JPEG images
- 🔷 TypeScript: TypeScript files

### Importance Levels
- 🔴 Critical: Essential project files
- 🟡 High: Important configuration files
- 🔵 Medium: Helpful but not essential files
