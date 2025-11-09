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
      // For combined reports, force Excel format
      const format = reportType === "combined" ? "xlsx" : reportFormat;

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
      setError(err.response?.data?.message || "Failed to generate report");
      toast.error("Failed to generate report", {
        description: err.response?.data?.message || "Please try again.",
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
                  padding: 12px 20px;
                  border-radius: 8px;
                  backdrop-filter: blur(10px);
                }
                
                .info-card strong {
                  display: block;
                  font-size: 12px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  margin-bottom: 5px;
                  opacity: 0.8;
                }
                
                .info-card span {
                  font-size: 16px;
                  font-weight: 600;
                }
                
                .filter-chip {
                  display: inline-block;
                  background: rgba(41, 128, 185, 0.25);
                  color: #3498db;
                  padding: 6px 15px;
                  border-radius: 20px;
                  font-size: 14px;
                  font-weight: 500;
                  margin-top: 10px;
                }
                
                .content {
                  background: white;
                  border-radius: 12px;
                  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
                  overflow: hidden;
                  margin-bottom: 30px;
                  padding: 20px;
                }
                
                .section {
                  margin-bottom: 30px;
                }
                
                .section-title {
                  font-size: 20px;
                  font-weight: 600;
                  margin-bottom: 15px;
                  padding-bottom: 10px;
                  border-bottom: 1px solid #eee;
                }
                
                .table-container {
                  overflow-x: auto;
                  max-height: 70vh;
                  overflow-y: auto;
                }
                
                table {
                  width: 100%;
                  border-collapse: collapse;
                  min-width: 1000px;
                }
                
                th {
                  background: #f8f9fa;
                  padding: 16px 12px;
                  text-align: left;
                  font-weight: 600;
                  color: #2c3e50;
                  position: sticky;
                  top: 0;
                  z-index: 10;
                  border-bottom: 2px solid #e9ecef;
                }
                
                th:first-child {
                  border-top-left-radius: 12px;
                }
                
                th:last-child {
                  border-top-right-radius: 12px;
                }
                
                td {
                  padding: 14px 12px;
                  border-bottom: 1px solid #e9ecef;
                  transition: background-color 0.2s;
                }
                
                tr:hover td {
                  background-color: #f8f9ff;
                }
                
                tr:last-child td {
                  border-bottom: none;
                }
                
                .employee-cell {
                  font-weight: 600;
                  color: #2c3e50;
                }
                
                .status-cell {
                  text-align: center;
                  font-weight: 600;
                  border-radius: 6px;
                  padding: 6px 12px;
                  display: inline-block;
                  min-width: 80px;
                }
                
                .status-P {
                  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                  color: white;
                  box-shadow: 0 2px 8px rgba(46, 204, 113, 0.3);
                }
                
                .status-A {
                  background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
                  color: white;
                  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
                }
                
                .status-L {
                  background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
                  color: white;
                  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
                }
                
                .status-1-2 {
                  background: linear-gradient(135deg, #f39c12 0%, #f1c40f 100%);
                  color: white;
                  box-shadow: 0 2px 8px rgba(241, 196, 15, 0.3);
                }
                
                .status-OD {
                  background: linear-gradient(135deg, #d35400 0%, #e67e22 100%);
                  color: white;
                  box-shadow: 0 2px 8px rgba(230, 126, 34, 0.3);
                }
                
                .day-header {
                  min-width: 80px;
                  text-align: center;
                }
                
                .day-cell {
                  text-align: center;
                  font-weight: 600;
                  border-radius: 4px;
                  padding: 4px 2px;
                }
                
                .day-P {
                  background-color: #e8f5e9;
                  color: #2e7d32;
                }
                
                .day-A {
                  background-color: #ffebee;
                  color: #c62828;
                }
                
                .day-L {
                  background-color: #e3f2fd;
                  color: #1565c0;
                }
                
                .day-1-2 {
                  background-color: #fff8e1;
                  color: #f57f17;
                }
                
                .day-OD {
                  background-color: #fbe9e7;
                  color: #d84315;
                }
                
                .no-data {
                  text-align: center;
                  padding: 60px 20px;
                  color: #7f8c8d;
                }
                
                .no-data svg {
                  width: 80px;
                  height: 80px;
                  margin-bottom: 20px;
                  opacity: 0.3;
                }
                
                .no-data h3 {
                  font-size: 22px;
                  margin-bottom: 15px;
                  color: #2c3e50;
                }
                
                .footer {
                  text-align: center;
                  padding: 20px;
                  color: #7f8c8d;
                  font-size: 14px;
                  border-top: 1px solid #eee;
                }
                
                @media (max-width: 768px) {
                  .header {
                    padding: 20px;
                  }
                  
                  .report-info {
                    flex-direction: column;
                    gap: 15px;
                  }
                  
                  th, td {
                    padding: 10px 8px;
                    font-size: 14px;
                  }
                  
                  .status-cell {
                    padding: 4px 8px;
                    font-size: 12px;
                    min-width: 60px;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M9 12H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M9 16H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${reportTitle}
                  </h1>
                  <div class="report-info">
                    <div class="info-card">
                      <strong>Report Type</strong>
                      <span>${
                        reportType.charAt(0).toUpperCase() + reportType.slice(1)
                      } Report</span>
                    </div>
                    <div class="info-card">
                      <strong>Date Range</strong>
                      <span>${format(
                        new Date(startDate),
                        "MMM d, yyyy"
                      )} - ${format(new Date(endDate), "MMM d, yyyy")}</span>
                    </div>
                    <div class="info-card">
                      <strong>Records</strong>
                      <span>${
                        (previewData.attendance
                          ? previewData.attendance.length
                          : 0) +
                        (previewData.leave ? previewData.leave.length : 0) +
                        (previewData.summary ? previewData.summary.length : 0)
                      } Records</span>
                    </div>
                  </div>
                  <div class="filter-chip">
                    Filter: ${filterText}
                  </div>
                </div>
                
                <div class="content">
                  <!-- Attendance Section -->
                  <div class="section">
                    <h2 class="section-title">Attendance Report Preview</h2>
                    ${
                      previewData.attendance &&
                      previewData.attendance.length > 0
                        ? `
                    <div class="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Employee ID</th>
                            <th>Employee Name</th>
                            ${dateHeaders
                              .slice(0, 5)
                              .map(
                                (date) => `
                              <th class="day-header">${format(
                                date,
                                "MMM d"
                              )}</th>
                            `
                              )
                              .join("")}
                            <th>Total Days</th>
                            <th>Present Days</th>
                            <th>Absent Days</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${previewData.attendance
                            .map(
                              (row: any) => `
                            <tr>
                              <td>${row["Employee ID"] || "-"}</td>
                              <td class="employee-cell">${
                                row["Employee Name"] || "-"
                              }</td>
                              ${dateHeaders
                                .slice(0, 5)
                                .map((date) => {
                                  const dayKey = `Day ${date.getDate()}`;
                                  const status = row[dayKey] || "A";
                                  let statusClass = "";
                                  switch (status) {
                                    case "P":
                                      statusClass = "day-P";
                                      break;
                                    case "A":
                                      statusClass = "day-A";
                                      break;
                                    case "L":
                                      statusClass = "day-L";
                                      break;
                                    case "1/2":
                                      statusClass = "day-1-2";
                                      break;
                                    case "OD":
                                      statusClass = "day-OD";
                                      break;
                                    default:
                                      statusClass = "";
                                  }
                                  return `<td class="day-cell ${statusClass}">${status}</td>`;
                                })
                                .join("")}
                              <td>${row["Total Office Working Days"] || 0}</td>
                              <td>${row["Employee Present Days"] || 0}</td>
                              <td>${row["Absent Days"] || 0}</td>
                            </tr>
                          `
                            )
                            .join("")}
                        </tbody>
                      </table>
                    </div>
                    `
                        : `
                    <div class="no-data">
                      <p>No attendance data available</p>
                    </div>
                    `
                    }
                  </div>
                  
                  <!-- Leave Section -->
                  <div class="section">
                    <h2 class="section-title">Leave Report Preview</h2>
                    ${
                      previewData.leave && previewData.leave.length > 0
                        ? `
                    <div class="table-container">
                      <table>
                        <thead>
                          <tr>
                            ${
                              previewData.leave[0]
                                ? Object.keys(previewData.leave[0])
                                    .map((key) => `<th>${key}</th>`)
                                    .join("")
                                : ""
                            }
                          </tr>
                        </thead>
                        <tbody>
                          ${previewData.leave
                            .map(
                              (row: any) => `
                            <tr>
                              ${
                                row
                                  ? Object.values(row)
                                      .map((value: any) => {
                                        const stringValue = String(value);
                                        if (
                                          stringValue.toLowerCase() ===
                                          "present"
                                        ) {
                                          return `<td><span class="status-cell status-P">${stringValue}</span></td>`;
                                        } else if (
                                          stringValue.toLowerCase() === "absent"
                                        ) {
                                          return `<td><span class="status-cell status-A">${stringValue}</span></td>`;
                                        } else if (
                                          stringValue
                                            .toLowerCase()
                                            .includes("leave") ||
                                          stringValue.toLowerCase() === "l"
                                        ) {
                                          return `<td><span class="status-cell status-L">${stringValue}</span></td>`;
                                        } else if (
                                          stringValue
                                            .toLowerCase()
                                            .includes("half") ||
                                          stringValue === "1/2"
                                        ) {
                                          return `<td><span class="status-cell status-1-2">${stringValue}</span></td>`;
                                        } else if (
                                          stringValue
                                            .toLowerCase()
                                            .includes("outside") ||
                                          stringValue.toLowerCase() === "od"
                                        ) {
                                          return `<td><span class="status-cell status-OD">${stringValue}</span></td>`;
                                        } else {
                                          return `<td>${stringValue}</td>`;
                                        }
                                      })
                                      .join("")
                                  : ""
                              }
                            </tr>
                          `
                            )
                            .join("")}
                        </tbody>
                      </table>
                    </div>
                    `
                        : `
                    <div class="no-data">
                      <p>No leave data available</p>
                    </div>
                    `
                    }
                  </div>
                  
                  <!-- Summary Section -->
                  <div class="section">
                    <h2 class="section-title">Summary Report Preview</h2>
                    ${
                      previewData.summary && previewData.summary.length > 0
                        ? `
                    <div class="table-container">
                      <table>
                        <thead>
                          <tr>
                            ${
                              previewData.summary[0]
                                ? Object.keys(previewData.summary[0])
                                    .map((key) => `<th>${key}</th>`)
                                    .join("")
                                : ""
                            }
                          </tr>
                        </thead>
                        <tbody>
                          ${previewData.summary
                            .map(
                              (row: any) => `
                            <tr>
                              ${
                                row
                                  ? Object.values(row)
                                      .map((value: any) => {
                                        const stringValue = String(value);
                                        if (
                                          stringValue.toLowerCase() ===
                                          "present"
                                        ) {
                                          return `<td><span class="status-cell status-P">${stringValue}</span></td>`;
                                        } else if (
                                          stringValue.toLowerCase() === "absent"
                                        ) {
                                          return `<td><span class="status-cell status-A">${stringValue}</span></td>`;
                                        } else if (
                                          stringValue
                                            .toLowerCase()
                                            .includes("leave") ||
                                          stringValue.toLowerCase() === "l"
                                        ) {
                                          return `<td><span class="status-cell status-L">${stringValue}</span></td>`;
                                        } else if (
                                          stringValue
                                            .toLowerCase()
                                            .includes("half") ||
                                          stringValue === "1/2"
                                        ) {
                                          return `<td><span class="status-cell status-1-2">${stringValue}</span></td>`;
                                        } else if (
                                          stringValue
                                            .toLowerCase()
                                            .includes("outside") ||
                                          stringValue.toLowerCase() === "od"
                                        ) {
                                          return `<td><span class="status-cell status-OD">${stringValue}</span></td>`;
                                        } else {
                                          return `<td>${stringValue}</td>`;
                                        }
                                      })
                                      .join("")
                                  : ""
                              }
                            </tr>
                          `
                            )
                            .join("")}
                        </tbody>
                      </table>
                    </div>
                    `
                        : `
                    <div class="no-data">
                      <p>No summary data available</p>
                    </div>
                    `
                    }
                  </div>
                </div>
                
                <div class="footer">
                  <p>Generated on ${format(
                    new Date(),
                    "MMMM d, yyyy 'at' h:mm a"
                  )}</p>
                  <p>© 2023 Geo-Fence Attendance System</p>
                </div>
              </div>
            </body>
            </html>
          `);
          previewWindow.document.close();
          return;
        }
      }

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
              padding: 12px 20px;
              border-radius: 8px;
              backdrop-filter: blur(10px);
            }
            
            .info-card strong {
              display: block;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 5px;
              opacity: 0.8;
            }
            
            .info-card span {
              font-size: 16px;
              font-weight: 600;
            }
            
            .filter-chip {
              display: inline-block;
              background: rgba(41, 128, 185, 0.25);
              color: #3498db;
              padding: 6px 15px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 500;
              margin-top: 10px;
            }
            
            .content {
              background: white;
              border-radius: 12px;
              box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
              overflow: hidden;
              margin-bottom: 30px;
            }
            
            .table-container {
              overflow-x: auto;
              max-height: 70vh;
              overflow-y: auto;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              min-width: 1000px;
            }
            
            th {
              background: #f8f9fa;
              padding: 16px 12px;
              text-align: left;
              font-weight: 600;
              color: #2c3e50;
              position: sticky;
              top: 0;
              z-index: 10;
              border-bottom: 2px solid #e9ecef;
            }
            
            th:first-child {
              border-top-left-radius: 12px;
            }
            
            th:last-child {
              border-top-right-radius: 12px;
            }
            
            td {
              padding: 14px 12px;
              border-bottom: 1px solid #e9ecef;
              transition: background-color 0.2s;
            }
            
            tr:hover td {
              background-color: #f8f9ff;
            }
            
            tr:last-child td {
              border-bottom: none;
            }
            
            .employee-cell {
              font-weight: 600;
              color: #2c3e50;
            }
            
            .status-cell {
              text-align: center;
              font-weight: 600;
              border-radius: 6px;
              padding: 6px 12px;
              display: inline-block;
              min-width: 80px;
            }
            
            .status-P {
              background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
              color: white;
              box-shadow: 0 2px 8px rgba(46, 204, 113, 0.3);
            }
            
            .status-A {
              background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
              color: white;
              box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
            }
            
            .status-L {
              background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
              color: white;
              box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
            }
            
            .status-1-2 {
              background: linear-gradient(135deg, #f39c12 0%, #f1c40f 100%);
              color: white;
              box-shadow: 0 2px 8px rgba(241, 196, 15, 0.3);
            }
            
            .status-OD {
              background: linear-gradient(135deg, #d35400 0%, #e67e22 100%);
              color: white;
              box-shadow: 0 2px 8px rgba(230, 126, 34, 0.3);
            }
            
            .day-header {
              min-width: 80px;
              text-align: center;
            }
            
            .day-cell {
              text-align: center;
              font-weight: 600;
              border-radius: 4px;
              padding: 4px 2px;
            }
            
            .day-P {
              background-color: #e8f5e9;
              color: #2e7d32;
            }
            
            .day-A {
              background-color: #ffebee;
              color: #c62828;
            }
            
            .day-L {
              background-color: #e3f2fd;
              color: #1565c0;
            }
            
            .day-1-2 {
              background-color: #fff8e1;
              color: #f57f17;
            }
            
            .day-OD {
              background-color: #fbe9e7;
              color: #d84315;
            }
            
            .no-data {
              text-align: center;
              padding: 60px 20px;
              color: #7f8c8d;
            }
            
            .no-data svg {
              width: 80px;
              height: 80px;
              margin-bottom: 20px;
              opacity: 0.3;
            }
            
            .no-data h3 {
              font-size: 22px;
              margin-bottom: 15px;
              color: #2c3e50;
            }
            
            .footer {
              text-align: center;
              padding: 20px;
              color: #7f8c8d;
              font-size: 14px;
              border-top: 1px solid #eee;
            }
            
            @media (max-width: 768px) {
              .header {
                padding: 20px;
              }
              
              .report-info {
                flex-direction: column;
                gap: 15px;
              }
              
              th, td {
                padding: 10px 8px;
                font-size: 14px;
              }
              
              .status-cell {
                padding: 4px 8px;
                font-size: 12px;
                min-width: 60px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 12H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 16H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${reportTitle}
              </h1>
              <div class="report-info">
                <div class="info-card">
                  <strong>Report Type</strong>
                  <span>${
                    reportType.charAt(0).toUpperCase() + reportType.slice(1)
                  } Report</span>
                </div>
                <div class="info-card">
                  <strong>Date Range</strong>
                  <span>${format(
                    new Date(startDate),
                    "MMM d, yyyy"
                  )} - ${format(new Date(endDate), "MMM d, yyyy")}</span>
                </div>
                <div class="info-card">
                  <strong>Records</strong>
                  <span>${previewData.length} Records</span>
                </div>
              </div>
              <div class="filter-chip">
                Filter: ${filterText}
              </div>
            </div>
            
            <div class="content">
              ${
                previewData.length > 0
                  ? `
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      ${
                        reportType === "attendance"
                          ? `
                        <th>Employee ID</th>
                        <th>Employee Name</th>
                        ${dateHeaders
                          .map(
                            (date) => `
                          <th class="day-header">${format(date, "MMM d")}</th>
                        `
                          )
                          .join("")}
                        <th>Total Days</th>
                        <th>Present Days</th>
                        <th>Absent Days</th>
                        <th>Half Days</th>
                        <th>Leave Days</th>
                        <th>Outside Duty Days</th>
                      `
                          : `
                        ${
                          previewData[0]
                            ? Object.keys(previewData[0])
                                .map((key) => `<th>${key}</th>`)
                                .join("")
                            : ""
                        }
                      `
                      }
                    </tr>
                  </thead>
                  <tbody>
                    ${previewData
                      .map(
                        (row: any) => `
                      <tr>
                        ${
                          reportType === "attendance"
                            ? `
                          <td>${row["Employee ID"] || "-"}</td>
                          <td class="employee-cell">${
                            row["Employee Name"] || "-"
                          }</td>
                          ${dateHeaders
                            .map((date, index) => {
                              const dayKey = `Day ${date.getDate()}`;
                              const status = row[dayKey] || "A";
                              let statusClass = "";
                              switch (status) {
                                case "P":
                                  statusClass = "day-P";
                                  break;
                                case "A":
                                  statusClass = "day-A";
                                  break;
                                case "L":
                                  statusClass = "day-L";
                                  break;
                                case "1/2":
                                  statusClass = "day-1-2";
                                  break;
                                case "OD":
                                  statusClass = "day-OD";
                                  break;
                                default:
                                  statusClass = "";
                              }
                              return `<td class="day-cell ${statusClass}">${status}</td>`;
                            })
                            .join("")}
                          <td>${row["Total Days"] || 0}</td>
                          <td>${row["Present Days"] || 0}</td>
                          <td>${row["Absent Days"] || 0}</td>
                          <td>${row["Half Days"] || 0}</td>
                          <td>${row["Leave Days"] || 0}</td>
                          <td>${row["Outside Duty Days"] || 0}</td>
                        `
                            : `
                          ${
                            row
                              ? Object.values(row)
                                  .map((value: any) => {
                                    const stringValue = String(value);
                                    if (
                                      stringValue.toLowerCase() === "present"
                                    ) {
                                      return `<td><span class="status-cell status-P">${stringValue}</span></td>`;
                                    } else if (
                                      stringValue.toLowerCase() === "absent"
                                    ) {
                                      return `<td><span class="status-cell status-A">${stringValue}</span></td>`;
                                    } else if (
                                      stringValue
                                        .toLowerCase()
                                        .includes("leave") ||
                                      stringValue.toLowerCase() === "l"
                                    ) {
                                      return `<td><span class="status-cell status-L">${stringValue}</span></td>`;
                                    } else if (
                                      stringValue
                                        .toLowerCase()
                                        .includes("half") ||
                                      stringValue === "1/2"
                                    ) {
                                      return `<td><span class="status-cell status-1-2">${stringValue}</span></td>`;
                                    } else if (
                                      stringValue
                                        .toLowerCase()
                                        .includes("outside") ||
                                      stringValue.toLowerCase() === "od"
                                    ) {
                                      return `<td><span class="status-cell status-OD">${stringValue}</span></td>`;
                                    } else {
                                      return `<td>${stringValue}</td>`;
                                    }
                                  })
                                  .join("")
                              : ""
                          }
                        `
                        }
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
              `
                  : `
              <div class="no-data">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 12H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 16H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h3>No Data Available</h3>
                <p>No records found for the selected filters and date range.</p>
              </div>
              `
              }
            </div>
            
            <div class="footer">
              <p>Generated on ${format(
                new Date(),
                "MMMM d, yyyy 'at' h:mm a"
              )}</p>
              <p>© 2023 Geo-Fence Attendance System</p>
            </div>
          </div>
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Generate and download attendance reports directly
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert>
          <AlertDescription className="text-green-600">
            {message}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Select parameters to generate attendance reports directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-blue-200" />
                <Input
                  id="start-date"
                  type="date"
                  className="pl-10"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-blue-200" />
                <Input
                  id="end-date"
                  type="date"
                  className="pl-10"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="leave">Leave Report</SelectItem>
                  <SelectItem value="combined">Combined Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-format">Format</Label>
              <Select
                value={reportFormat}
                onValueChange={setReportFormat}
                disabled={reportType === "combined"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
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

          <div className="flex justify-end space-x-2">
            <Button
              onClick={previewReport}
              disabled={previewing}
              variant="outline"
            >
              {previewing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Preview Data
            </Button>

            <Button
              onClick={openPreviewInNewTab}
              disabled={
                !showPreview ||
                (Array.isArray(previewData)
                  ? previewData.length === 0
                  : !(
                      previewData as {
                        attendance: any[];
                        leave: any[];
                        summary: any[];
                      }
                    ).attendance ||
                    !(
                      previewData as {
                        attendance: any[];
                        leave: any[];
                        summary: any[];
                      }
                    ).leave ||
                    !(
                      previewData as {
                        attendance: any[];
                        leave: any[];
                        summary: any[];
                      }
                    ).summary ||
                    ((
                      previewData as {
                        attendance: any[];
                        leave: any[];
                        summary: any[];
                      }
                    ).attendance.length === 0 &&
                      (
                        previewData as {
                          attendance: any[];
                          leave: any[];
                          summary: any[];
                        }
                      ).leave.length === 0 &&
                      (
                        previewData as {
                          attendance: any[];
                          leave: any[];
                          summary: any[];
                        }
                      ).summary.length === 0))
              }
              variant="outline"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview in New Tab
            </Button>
            <Button onClick={generateReport} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
