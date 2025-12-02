# 📁 SAMS - Project Structure

*Generated on: 12/1/2025, 9:21:23 PM*

## 📋 Quick Overview

| Metric | Value |
|--------|-------|
| 📄 Total Files | 186 |
| 📁 Total Folders | 30 |
| 🌳 Max Depth | 3 levels |
| 🛠️ Tech Stack | React, TypeScript, CSS, Node.js |

## ⭐ Important Files

- 🟡 🚫 **.gitignore** - Git ignore rules
- 🟡 🔒 **package-lock.json** - Dependency lock
- 🔴 📦 **package.json** - Package configuration
- 🔴 📖 **README.md** - Project documentation
- 🟡 🔒 **package-lock.json** - Dependency lock
- 🔴 📦 **package.json** - Package configuration
- 🔴 📖 **README.md** - Project documentation
- 🟡 🔷 **tsconfig.json** - TypeScript config

## 📊 File Statistics

### By File Type

- ⚛️ **.tsx** (React TypeScript files): 76 files (40.9%)
- 📜 **.js** (JavaScript files): 67 files (36.0%)
- 🔷 **.ts** (TypeScript files): 13 files (7.0%)
- ⚙️ **.json** (JSON files): 7 files (3.8%)
- 📖 **.md** (Markdown files): 7 files (3.8%)
- 🎨 **.svg** (SVG images): 4 files (2.2%)
- 📄 **.example** (Other files): 2 files (1.1%)
- 📄 **.cjs** (Other files): 2 files (1.1%)
- 🎨 **.css** (Stylesheets): 2 files (1.1%)
- 🚫 **.gitignore** (Git ignore): 1 files (0.5%)
- 🌐 **.html** (HTML files): 1 files (0.5%)
- 🖼️ **.ico** (Icon files): 1 files (0.5%)
- 🖼️ **.png** (PNG images): 1 files (0.5%)
- 📄 **.webmanifest** (Other files): 1 files (0.5%)
- 🖼️ **.jpg** (JPEG images): 1 files (0.5%)

### By Category

- **React**: 76 files (40.9%)
- **JavaScript**: 67 files (36.0%)
- **TypeScript**: 13 files (7.0%)
- **Config**: 7 files (3.8%)
- **Docs**: 7 files (3.8%)
- **Assets**: 7 files (3.8%)
- **Other**: 5 files (2.7%)
- **Styles**: 2 files (1.1%)
- **DevOps**: 1 files (0.5%)
- **Web**: 1 files (0.5%)

### 📁 Largest Directories

- **root**: 186 files
- **src**: 91 files
- **backend**: 67 files
- **src\components**: 51 files
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
│   │   ├── 📜 holidayExtended.test.js
│   │   ├── 📜 holidayRules.test.js
│   │   ├── 📜 leave.test.js
│   │   ├── 📜 multiBranchAttendance.test.js
│   │   ├── 📜 user.test.js
│   │   ├── 📜 userExtended.test.js
│   │   └── 📜 workingHoursRule.test.js
│   ├── 📄 .env.example
│   ├── 📜 jest.config.js
│   ├── 🟡 🔒 **package-lock.json**
│   ├── 🔴 📦 **package.json**
│   ├── 🔴 📖 **README.md**
│   ├── 📂 scripts/
│   │   ├── 📜 debug-attendance.js
│   │   ├── 📜 list-branches.js
│   │   ├── 📜 list-users.js
│   │   ├── 📜 seed-users.js
│   │   └── 📜 simple-login-test.js
│   ├── 📁 src/
│   │   ├── 📜 App.js
│   │   ├── ⚙️ config/
│   │   │   ├── 📜 database.js
│   │   │   └── 📜 logger.js
│   │   ├── 📂 controllers/
│   │   │   ├── 📜 adminController.js
│   │   │   ├── 📜 attendanceController.js
│   │   │   ├── 📜 authController.js
│   │   │   ├── 📜 branchController.js
│   │   │   ├── 📜 detailedReportController.js
│   │   │   ├── 📜 holidayController.js
│   │   │   ├── 📜 leaveController.js
│   │   │   ├── 📜 managerController.js
│   │   │   ├── 📜 notificationsController.js
│   │   │   ├── 📜 reportController.js
│   │   │   └── 📜 streamReportController.js
│   │   ├── 📂 jobs/
│   │   │   ├── 📜 autoCheckout.js
│   │   │   ├── 📜 birthdayNotifications.js
│   │   │   └── 📜 daily.js
│   │   ├── 📂 middelwares/
│   │   │   └── 📜 auth.js
│   │   ├── 📂 middleware/
│   │   │   └── 📜 auth.js
│   │   ├── 📂 models/
│   │   │   ├── 📜 Attendance.js
│   │   │   ├── 📜 Branch.js
│   │   │   ├── 📜 Holiday.js
│   │   │   ├── 📜 LeaveRequest.js
│   │   │   ├── 📜 NotificationLog.js
│   │   │   ├── 📜 Report.js
│   │   │   ├── 📜 Session.js
│   │   │   └── 📜 User.js
│   │   ├── 📂 routes/
│   │   │   ├── 📜 admin.js
│   │   │   ├── 📜 attendance.js
│   │   │   ├── 📜 auth.js
│   │   │   ├── 📜 branches.js
│   │   │   ├── 📜 detailedReports.js
│   │   │   ├── 📜 holidays.js
│   │   │   ├── 📜 leaves.js
│   │   │   ├── 📜 manager.js
│   │   │   ├── 📜 notifications.js
│   │   │   ├── 📜 publicHolidays.js
│   │   │   └── 📜 reports.js
│   │   ├── 📜 server.js
│   │   ├── 📂 services/
│   │   │   └── 📜 notificationService.js
│   │   └── 🔧 utils/
│   │   │   ├── 📜 detailedAttendanceReport.js
│   │   │   ├── 📜 excel.js
│   │   │   ├── 📜 haversine.js
│   │   │   └── 📜 validation.js
│   ├── 📜 test-env-config.js
│   └── 🧪 tests/
│   │   └── 📜 userModel.test.js
├── 📂 dev-dist/
│   ├── 📜 registerSW.js
│   ├── 📜 sw.js
│   └── 📜 workbox-5a5d9309.js
├── 📖 DOCS/
│   ├── 📖 NEW_FEATURES.md
│   ├── 📖 PROJECT_STATUS.md
│   └── 📖 UPDATE_SUMMARY.md
├── 📜 eslint.config.js
├── 🌐 index.html
├── 🟡 🔒 **package-lock.json**
├── 🔴 📦 **package.json**
├── 📄 postcss.config.cjs
├── 🌐 public/
│   ├── 🖼️ favicon.ico
│   ├── 🖼️ logo192.png
│   ├── 🎨 logo192.svg
│   ├── 🎨 logo512.svg
│   ├── 📄 manifest.webmanifest
│   └── 🎨 vite.svg
├── 🔴 📖 **README.md**
├── 📖 SETUP.md
├── 📁 src/
│   ├── 🎨 App.css
│   ├── ⚛️ App.tsx
│   ├── 📦 assets/
│   │   ├── 🎨 react.svg
│   │   └── 🖼️ sidebarbg.jpg
│   ├── 🧩 components/
│   │   ├── ⚛️ AttendanceConfirmationDialog.tsx
│   │   ├── ⚛️ ReportPreview.tsx
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
│   │   │   ├── ⚛️ ApplyLeave.tsx
│   │   │   ├── ⚛️ Attendance.tsx
│   │   │   ├── ⚛️ Dashboard.tsx
│   │   │   ├── ⚛️ History.tsx
│   │   │   └── ⚛️ Profile.tsx
│   │   ├── ⚛️ Index.tsx
│   │   ├── ⚛️ Login.tsx
│   │   ├── 📂 Manager/
│   │   │   ├── ⚛️ AddEmployee.tsx
│   │   │   ├── ⚛️ Analytics.tsx
│   │   │   ├── ⚛️ Attendance.tsx
│   │   │   ├── ⚛️ AttendanceApprovals.tsx
│   │   │   ├── ⚛️ EmployeeTrends.tsx
│   │   │   ├── ⚛️ Holidays.tsx
│   │   │   ├── ⚛️ LeaveApprovals.tsx
│   │   │   ├── ⚛️ Profile.tsx
│   │   │   ├── ⚛️ Reports.tsx
│   │   │   └── ⚛️ TeamTrends.tsx
│   │   └── ⚛️ NotFound.tsx
│   ├── 🔷 service-worker.ts
│   ├── 📂 services/
│   │   └── 🔷 api.ts
│   ├── 📂 stores/
│   │   ├── 🔷 authStore.ts
│   │   └── 🔷 birthdayStore.ts
│   ├── 🔷 test-pwa.ts
│   └── 📂 types/
│   │   └── 🔷 index.ts
├── 📖 STREAMING_REPORTS.md
├── 📄 tailwind.config.cjs
├── ⚛️ toggle-group.tsx
├── ⚙️ tsconfig.app.json
├── 🟡 🔷 **tsconfig.json**
├── ⚙️ tsconfig.node.json
└── 🔷 vite.config.ts
```

## 📖 Legend

### File Types
- 📄 Other: Other files
- 🚫 DevOps: Git ignore
- 📜 JavaScript: JavaScript files
- ⚙️ Config: JSON files
- 📖 Docs: Markdown files
- 🌐 Web: HTML files
- 🖼️ Assets: Icon files
- 🖼️ Assets: PNG images
- 🎨 Assets: SVG images
- 🎨 Styles: Stylesheets
- ⚛️ React: React TypeScript files
- 🖼️ Assets: JPEG images
- 🔷 TypeScript: TypeScript files

### Importance Levels
- 🔴 Critical: Essential project files
- 🟡 High: Important configuration files
- 🔵 Medium: Helpful but not essential files
