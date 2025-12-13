import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, Download, Calendar, Eye } from "lucide-react";
import { reportAPI } from "@/services/api";
import { format } from "date-fns";
import { toast } from "@/components/ui/sonner";
import type { User } from "@/types";

interface Employee extends User {
  id: string;
}

export default function ManagerReports() {
  // SYSTEM_ATTENDANCE_START_DATE constant
  const SYSTEM_ATTENDANCE_START_DATE = "2025-12-03";
  
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [reportType, setReportType] = useState("attendance");
  const [reportFormat, setReportFormat] = useState("csv");
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      // Since we don't have a managerAPI.getTeamMembers anymore, we'll need to implement this
      // For now, let's just set an empty array
      setEmployees([]);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setError("Failed to fetch employee data");
      toast.error("Failed to fetch employees", {
        description: "Could not load employee data. Please try again.",
      });
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Use streaming for direct download instead of saving to server
      // Note: XLSX format has been removed due to security vulnerabilities
      const format = reportFormat;

      // Use streaming for direct download instead of saving to server
      const blob = await reportAPI.streamReport({
        type: reportType,
        format,
        startDate,
        endDate,
        filters:
          selectedEmployee === "all" ? {} : { employeeId: selectedEmployee },
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_report_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded", {
        description: "Your report has been downloaded successfully.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
      toast.error("Failed to generate report", {
        description: err.message || "Please try again.",
      });
      console.error("Failed to generate report:", err);
    } finally {
      setLoading(false);
    }
  };

  const previewReport = async () => {
    setPreviewing(true);
    setError("");
    setMessage("");

    // Log the data being sent for debugging
    console.log("=== PREVIEW REPORT DATA ===");
    console.log("Type:", reportType);
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);
    console.log(
      "Filters:",
      selectedEmployee === "all" ? {} : { employeeId: selectedEmployee }
    );

    try {
      const response = await reportAPI.previewReport({
        type: reportType,
        startDate,
        endDate,
        filters:
          selectedEmployee === "all" ? {} : { employeeId: selectedEmployee },
      });

      if (response.success && response.data) {
        setPreviewData(response.data.reportData);
        setShowPreview(true);
        setMessage(
          `Preview generated with ${response.data.recordCount} records`
        );
        toast.success("Preview generated", {
          description: `Preview generated with ${response.data.recordCount} records.`,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to preview report");
      toast.error("Failed to preview report", {
        description: err.response?.data?.message || "Please try again.",
      });
      console.error("Failed to preview report:", err);
    } finally {
      setPreviewing(false);
    }
  };

  // Function to open preview in a new tab with enhanced UI/UX for all report types
  const openPreviewInNewTab = () => {
    // Create a new window/tab with the preview data
    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      // Create a comprehensive preview with filters applied
      const filterText =
        selectedEmployee === "all"
          ? "All Employees"
          : `Employee ID: ${selectedEmployee}`;

      // Generate date headers for attendance reports
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateHeaders: Date[] = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        dateHeaders.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Generate title based on report type
      const reportTitle = `${
        reportType.charAt(0).toUpperCase() + reportType.slice(1)
      } Report Preview`;

      // For combined reports, we need to handle the data structure differently
      if (reportType === "combined") {
        // Type guard to check if previewData is a combined report structure
        const isCombinedData = (
          data: any
        ): data is { attendance: any[]; leave: any[]; summary: any[] } => {
          return (
            data &&
            typeof data === "object" &&
            "attendance" in data &&
            "leave" in data &&
            "summary" in data
          );
        };

        if (isCombinedData(previewData)) {
          previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${reportTitle}</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                body {
                  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
                  color: #333;
                  line-height: 1.6;
                  padding: 20px;
                  min-height: 100vh;
                }
                
                .container {
                  max-width: 1400px;
                  margin: 0 auto;
                }
                
                .header {
                  background: linear-gradient(90deg, #2c3e50 0%, #1a2a3a 100%);
                  color: white;
                  padding: 25px 30px;
                  border-radius: 12px;
                  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                  margin-bottom: 30px;
                  position: relative;
                  overflow: hidden;
                }
                
                .header::before {
                  content: "";
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 4px;
                  background: linear-gradient(90deg, #3498db, #2ecc71, #f1c40f, #e74c3c);
                }
                
                .header h1 {
                  font-size: 28px;
                  font-weight: 700;
                  margin-bottom: 15px;
                  display: flex;
                  align-items: center;
                  gap: 12px;
                }
                
                .header h1 svg {
                  width: 32px;
                  height: 32px;
                }
                
                .report-info {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 25px;
                  margin-bottom: 15px;
                }
                
                .info-card {
                  background: rgba(255, 255, 255, 0.15);
                  padding: 12px 18px;
                  border-radius: 8px;
                  backdrop-filter: blur(10px);
                }
                
                .info-card h3 {
                  font-size: 14px;
                  font-weight: 600;
                  opacity: 0.9;
                  margin-bottom: 6px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                
                .info-card p {
                  font-size: 16px;
                  font-weight: 500;
                }
                
                .content-section {
                  background: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
                  margin-bottom: 30px;
                  overflow: hidden;
                }
                
                .section-header {
                  background: #f8f9fa;
                  padding: 20px 25px;
                  border-bottom: 1px solid #eaeaea;
                  display: flex;
                  align-items: center;
                  gap: 12px;
                }
                
                .section-header h2 {
                  font-size: 20px;
                  font-weight: 600;
                  color: #2c3e50;
                }
                
                .section-header svg {
                  width: 24px;
                  height: 24px;
                  color: #3498db;
                }
                
                .table-container {
                  padding: 25px;
                  overflow-x: auto;
                }
                
                table {
                  width: 100%;
                  border-collapse: collapse;
                  min-width: 800px;
                }
                
                th {
                  background: #3498db;
                  color: white;
                  text-align: left;
                  padding: 14px 16px;
                  font-weight: 600;
                  position: sticky;
                  top: 0;
                }
                
                td {
                  padding: 12px 16px;
                  border-bottom: 1px solid #eee;
                  vertical-align: top;
                }
                
                tr:nth-child(even) {
                  background-color: #f8f9fa;
                }
                
                tr:hover {
                  background-color: #e3f2fd;
                }
                
                .status-present {
                  background: #d4edda;
                  color: #155724;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-weight: 500;
                  font-size: 12px;
                }
                
                .status-absent {
                  background: #f8d7da;
                  color: #721c24;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-weight: 500;
                  font-size: 12px;
                }
                
                .status-half {
                  background: #cce7ff;
                  color: #004085;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-weight: 500;
                  font-size: 12px;
                }
                
                .status-leave {
                  background: #fff3cd;
                  color: #856404;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-weight: 500;
                  font-size: 12px;
                }
                
                .status-outside {
                  background: #d1ecf1;
                  color: #0c5460;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-weight: 500;
                  font-size: 12px;
                }
                
                .footer {
                  text-align: center;
                  padding: 20px;
                  color: #6c757d;
                  font-size: 14px;
                  border-top: 1px solid #eaeaea;
                  margin-top: 20px;
                }
                
                @media (max-width: 768px) {
                  .header {
                    padding: 20px;
                  }
                  
                  .header h1 {
                    font-size: 24px;
                  }
                  
                  .report-info {
                    flex-direction: column;
                    gap: 15px;
                  }
                  
                  .table-container {
                    padding: 15px;
                  }
                  
                  th, td {
                    padding: 10px 12px;
                    font-size: 14px;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 17H7A5 5 0 0 1 7 7h2" stroke-width="2" stroke-linecap="round"/>
                      <path d="M15 7h2a5 5 0 1 1 0 10h-2" stroke-width="2" stroke-linecap="round"/>
                      <line x1="8" y1="12" x2="16" y2="12" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    ${reportTitle}
                  </h1>
                  <div class="report-info">
                    <div class="info-card">
                      <h3>Period</h3>
                      <p>${format(start, "MMM dd, yyyy")} - ${format(end, "MMM dd, yyyy")}</p>
                    </div>
                    <div class="info-card">
                      <h3>Filter</h3>
                      <p>${filterText}</p>
                    </div>
                    <div class="info-card">
                      <h3>Generated</h3>
                      <p>${new Date().toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Attendance Section -->
                <div class="content-section">
                  <div class="section-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke-width="2" stroke-linecap="round"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke-width="2" stroke-linecap="round"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <h2>Attendance Records (${previewData.attendance.length} records)</h2>
                  </div>
                  <div class="table-container">
                    ${
                      previewData.attendance.length > 0
                        ? `
                        <table>
                          <thead>
                            <tr>
                              ${Object.keys(previewData.attendance[0])
                                .map((key) => `<th>${key}</th>`)
                                .join("")}
                            </tr>
                          </thead>
                          <tbody>
                            ${previewData.attendance
                              .map(
                                (row) => `
                                  <tr>
                                    ${Object.entries(row)
                                      .map(([key, value]) => {
                                        // Apply status styling for specific columns
                                        // Create dynamic dayColumns based on actual date headers
                                        const dayColumns = Object.keys(row).filter(key => /^[A-Z]{3}-\d{1,2}$/.test(key));
                                        
                                        if (dayColumns.includes(key)) {
                                          if (value === "P") {
                                            return `<td><span class="status-present">${value}</span></td>`;
                                          } else if (value === "A") {
                                            return `<td><span class="status-absent">${value}</span></td>`;
                                          } else if (value === "1/2") {
                                            return `<td><span class="status-half">${value}</span></td>`;
                                          } else if (value === "L") {
                                            return `<td><span class="status-leave">${value}</span></td>`;
                                          } else if (value === "OD") {
                                            return `<td><span class="status-outside">${value}</span></td>`;
                                          } else {
                                            return `<td>${value || ""}</td>`;
                                          }
                                        }
                                        return `<td>${value || ""}</td>`;
                                      })
                                      .join("")}
                                  </tr>
                                `
                              )
                              .join("")}
                          </tbody>
                        </table>
                      `
                        : "<p>No attendance records found for the selected period.</p>"
                    }
                  </div>
                </div>
                
                <!-- Leave Section -->
                <div class="content-section">
                  <div class="section-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-width="2"/>
                      <polyline points="14,2 14,8 20,8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <line x1="16" y1="13" x2="8" y2="13" stroke-width="2" stroke-linecap="round"/>
                      <line x1="16" y1="17" x2="8" y2="17" stroke-width="2" stroke-linecap="round"/>
                      <polyline points="10,9 9,9 8,9" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <h2>Leave Records (${previewData.leave.length} records)</h2>
                  </div>
                  <div class="table-container">
                    ${
                      previewData.leave.length > 0
                        ? `
                        <table>
                          <thead>
                            <tr>
                              ${Object.keys(previewData.leave[0])
                                .map((key) => `<th>${key}</th>`)
                                .join("")}
                            </tr>
                          </thead>
                          <tbody>
                            ${previewData.leave
                              .map(
                                (row) => `
                                  <tr>
                                    ${Object.values(row)
                                      .map((value) => `<td>${value || ""}</td>`)
                                      .join("")}
                                  </tr>
                                `
                              )
                              .join("")}
                          </tbody>
                        </table>
                      `
                        : "<p>No leave records found for the selected period.</p>"
                    }
                  </div>
                </div>
                
                <!-- Summary Section -->
                <div class="content-section">
                  <div class="section-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" stroke-width="2"/>
                      <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/>
                      <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <h2>Summary Records (${previewData.summary.length} records)</h2>
                  </div>
                  <div class="table-container">
                    ${
                      previewData.summary.length > 0
                        ? `
                        <table>
                          <thead>
                            <tr>
                              ${Object.keys(previewData.summary[0])
                                .map((key) => `<th>${key}</th>`)
                                .join("")}
                            </tr>
                          </thead>
                          <tbody>
                            ${previewData.summary
                              .map(
                                (row) => `
                                  <tr>
                                    ${Object.values(row)
                                      .map((value) => `<td>${value || ""}</td>`)
                                      .join("")}
                                  </tr>
                                `
                              )
                              .join("")}
                          </tbody>
                        </table>
                      `
                        : "<p>No summary records found for the selected period.</p>"
                    }
                  </div>
                </div>
                
                <div class="footer">
                  <p>Generated by SAMS v2.0 - Geo-Fence Attendance Management System</p>
                </div>
              </div>
            </body>
            </html>
          `);
        } else {
          previewWindow.document.write(`
            <html>
            <head>
              <title>${reportTitle}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .error { color: red; font-weight: bold; }
              </style>
            </head>
            <body>
              <h1>Error</h1>
              <p class="error">Unable to display preview data structure.</p>
            </body>
            </html>
          `);
        }
      } else {
        // For single report types
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${reportTitle}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              }
              
              body {
                background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
                color: #333;
                line-height: 1.6;
                padding: 20px;
                min-height: 100vh;
              }
              
              .container {
                max-width: 1400px;
                margin: 0 auto;
              }
              
              .header {
                background: linear-gradient(90deg, #2c3e50 0%, #1a2a3a 100%);
                color: white;
                padding: 25px 30px;
                border-radius: 12px;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                margin-bottom: 30px;
                position: relative;
                overflow: hidden;
              }
              
              .header::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #3498db, #2ecc71, #f1c40f, #e74c3c);
              }
              
              .header h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 12px;
              }
              
              .header h1 svg {
                width: 32px;
                height: 32px;
              }
              
              .report-info {
                display: flex;
                flex-wrap: wrap;
                gap: 25px;
                margin-bottom: 15px;
              }
              
              .info-card {
                background: rgba(255, 255, 255, 0.15);
                padding: 12px 18px;
                border-radius: 8px;
                backdrop-filter: blur(10px);
              }
              
              .info-card h3 {
                font-size: 14px;
                font-weight: 600;
                opacity: 0.9;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              
              .info-card p {
                font-size: 16px;
                font-weight: 500;
              }
              
              .content-section {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
                margin-bottom: 30px;
                overflow: hidden;
              }
              
              .section-header {
                background: #f8f9fa;
                padding: 20px 25px;
                border-bottom: 1px solid #eaeaea;
                display: flex;
                align-items: center;
                gap: 12px;
              }
              
              .section-header h2 {
                font-size: 20px;
                font-weight: 600;
                color: #2c3e50;
              }
              
              .section-header svg {
                width: 24px;
                height: 24px;
                color: #3498db;
              }
              
              .table-container {
                padding: 25px;
                overflow-x: auto;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                min-width: 800px;
              }
              
              th {
                background: #3498db;
                color: white;
                text-align: left;
                padding: 14px 16px;
                font-weight: 600;
                position: sticky;
                top: 0;
              }
              
              td {
                padding: 12px 16px;
                border-bottom: 1px solid #eee;
                vertical-align: top;
              }
              
              tr:nth-child(even) {
                background-color: #f8f9fa;
              }
              
              tr:hover {
                background-color: #e3f2fd;
              }
              
              .status-present {
                background: #d4edda;
                color: #155724;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: 500;
                font-size: 12px;
              }
              
              .status-absent {
                background: #f8d7da;
                color: #721c24;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: 500;
                font-size: 12px;
              }
              
              .status-half {
                background: #cce7ff;
                color: #004085;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: 500;
                font-size: 12px;
              }
              
              .status-leave {
                background: #fff3cd;
                color: #856404;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: 500;
                font-size: 12px;
              }
              
              .status-outside {
                background: #d1ecf1;
                color: #0c5460;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: 500;
                font-size: 12px;
              }
              
              .footer {
                text-align: center;
                padding: 20px;
                color: #6c757d;
                font-size: 14px;
                border-top: 1px solid #eaeaea;
                margin-top: 20px;
              }
              
              @media (max-width: 768px) {
                .header {
                  padding: 20px;
                }
                
                .header h1 {
                  font-size: 24px;
                }
                
                .report-info {
                  flex-direction: column;
                  gap: 15px;
                }
                
                .table-container {
                  padding: 15px;
                }
                
                th, td {
                  padding: 10px 12px;
                  font-size: 14px;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 17H7A5 5 0 0 1 7 7h2" stroke-width="2" stroke-linecap="round"/>
                    <path d="M15 7h2a5 5 0 1 1 0 10h-2" stroke-width="2" stroke-linecap="round"/>
                    <line x1="8" y1="12" x2="16" y2="12" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  ${reportTitle}
                </h1>
                <div class="report-info">
                  <div class="info-card">
                    <h3>Period</h3>
                    <p>${format(start, "MMM dd, yyyy")} - ${format(end, "MMM dd, yyyy")}</p>
                  </div>
                  <div class="info-card">
                    <h3>Filter</h3>
                    <p>${filterText}</p>
                  </div>
                  <div class="info-card">
                    <h3>Generated</h3>
                    <p>${new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div class="content-section">
                <div class="section-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke-width="2" stroke-linecap="round"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke-width="2" stroke-linecap="round"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <h2>Report Records (${previewData.length} records)</h2>
                </div>
                <div class="table-container">
                  ${
                    previewData.length > 0
                      ? `
                      <table>
                        <thead>
                          <tr>
                            ${Object.keys(previewData[0])
                              .map((key) => `<th>${key}</th>`)
                              .join("")}
                          </tr>
                        </thead>
                        <tbody>
                          ${previewData
                            .map(
                              (row) => `
                                <tr>
                                  ${Object.entries(row)
                                    .map(([key, value]) => {
                                      // Apply status styling for specific columns
                                      // Create dynamic dayColumns based on actual date headers
                                      const dayColumns = Object.keys(row).filter(key => /^[A-Z]{3}-\d{1,2}$/.test(key));
                                      
                                      if (dayColumns.includes(key)) {
                                        if (value === "P") {
                                          return `<td><span class="status-present">${value}</span></td>`;
                                        } else if (value === "A") {
                                          return `<td><span class="status-absent">${value}</span></td>`;
                                        } else if (value === "1/2") {
                                          return `<td><span class="status-half">${value}</span></td>`;
                                        } else if (value === "L") {
                                          return `<td><span class="status-leave">${value}</span></td>`;
                                        } else if (value === "OD") {
                                          return `<td><span class="status-outside">${value}</span></td>`;
                                        } else {
                                          return `<td>${value || ""}</td>`;
                                        }
                                      }
                                      return `<td>${value || ""}</td>`;
                                    })
                                    .join("")}
                                </tr>
                              `
                            )
                            .join("")}
                        </tbody>
                      </table>
                    `
                      : "<p>No records found for the selected period.</p>"
                  }
                </div>
              </div>
              
              <div class="footer">
                <p>Generated by SAMS v2.0 - Geo-Fence Attendance Management System</p>
              </div>
            </div>
          </body>
          </html>
        `);
      }
      previewWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Reports
          </CardTitle>
          <CardDescription>
            Create attendance, leave, and summary reports for your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    // Check if the selected date is before system start date
                    if (newStartDate < SYSTEM_ATTENDANCE_START_DATE) {
                      setError("Reports can only be generated from 03-Dec-2025 onwards.");
                    } else {
                      setError("");
                    }
                    setStartDate(newStartDate);
                  }}
                  min={SYSTEM_ATTENDANCE_START_DATE}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    const newEndDate = e.target.value;
                    // Check if the selected date is before system start date
                    if (newEndDate < SYSTEM_ATTENDANCE_START_DATE) {
                      setError("Reports can only be generated from 03-Dec-2025 onwards.");
                    } else {
                      setError("");
                    }
                    setEndDate(newEndDate);
                  }}
                  min={SYSTEM_ATTENDANCE_START_DATE}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select onValueChange={setReportType} value={reportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="combined">Combined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-format">Format</Label>
              <Select onValueChange={setReportFormat} value={reportFormat}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  {/* XLSX option removed due to security vulnerabilities */}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-filter">Employee Filter</Label>
              <Select
                onValueChange={setSelectedEmployee}
                value={selectedEmployee}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.empId}>
                      {employee.name} ({employee.empId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={generateReport}
              disabled={loading || (error && error.includes("Reports can only be generated from")) || false}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Generate & Download
            </Button>
            <Button
              onClick={previewReport}
              disabled={previewing || (error && error.includes("Reports can only be generated from")) || false}
              variant="outline"
              className="flex items-center gap-2"
            >
              {previewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Preview Report
            </Button>
            {showPreview && (
              <Button
                onClick={openPreviewInNewTab}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Open Preview in New Tab
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}