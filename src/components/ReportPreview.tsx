import React from "react";
import { format } from "date-fns";

interface Employee {
  id: string;
  _id: string;
  empId: string;
  name: string;
  email: string;
  role: "employee" | "manager" | "director";
  officeLocation: {
    lat: number;
    lng: number;
    radius: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReportPreviewProps {
  reportType: string;
  startDate: string;
  endDate: string;
  previewData: any[] | { attendance: any[]; leave: any[]; summary: any[] };
  selectedEmployee: string;
  employees: Employee[];
  filterText: string;
}

export default function ReportPreview({
  reportType,
  startDate,
  endDate,
  previewData,
  selectedEmployee,
  employees,
  filterText,
}: ReportPreviewProps) {
  // Generate date headers for attendance reports
  const generateDateHeaders = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateHeaders: Date[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      dateHeaders.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateHeaders;
  };

  const dateHeaders = generateDateHeaders();

  // Generate title based on report type
  const reportTitle = `${
    reportType.charAt(0).toUpperCase() + reportType.slice(1)
  } Report Preview`;

  // Render combined report preview
  const renderCombinedReport = () => {
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

    if (!previewData || !isCombinedData(previewData)) {
      return (
        <div className="text-center py-12 text-gray-500">
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-500">
            No records found for the selected filters and date range.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Attendance Report Preview */}
        <div>
          <h3 className="text-lg font-bold mb-4 pb-2 border-b">
            Attendance Report Preview
          </h3>
          {previewData.attendance && previewData.attendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee Name
                    </th>
                    {dateHeaders.slice(0, 5).map((date, index) => (
                      <th
                        key={index}
                        className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {format(date, "MMM d")}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absent Days
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.attendance.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row["Employee ID"] || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row["Employee Name"] || "-"}
                      </td>
                      {dateHeaders.slice(0, 5).map((date, dateIndex) => {
                        const dayKey = `Day ${date.getDate()}`;
                        const status = row[dayKey] || "A";
                        let statusClass = "";

                        switch (status) {
                          case "P":
                            statusClass = "bg-green-100 text-green-800";
                            break;
                          case "A":
                            statusClass = "bg-red-100 text-red-800";
                            break;
                          case "L":
                            statusClass = "bg-blue-100 text-blue-800";
                            break;
                          case "1/2":
                            statusClass = "bg-yellow-100 text-yellow-800";
                            break;
                          case "OD":
                            statusClass = "bg-orange-100 text-orange-800";
                            break;
                          default:
                            statusClass = "bg-gray-100 text-gray-800";
                        }

                        return (
                          <td
                            key={dateIndex}
                            className={`px-2 py-4 whitespace-nowrap text-sm text-center font-medium ${statusClass} rounded`}
                          >
                            {status}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row["Total Office Working Days"] || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row["Employee Present Days"] || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row["Employee Absent Days"] || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No attendance data available
            </div>
          )}
        </div>

        {/* Leave Report Preview */}
        <div>
          <h3 className="text-lg font-bold mb-4 pb-2 border-b">
            Leave Report Preview
          </h3>
          {previewData.leave && previewData.leave.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {previewData.leave[0] &&
                      Object.keys(previewData.leave[0]).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.leave.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {row &&
                        Object.entries(row).map(
                          ([key, value]: [string, any], cellIndex: number) => {
                            const stringValue = String(value);
                            let statusClass = "";

                            if (stringValue.toLowerCase() === "present") {
                              statusClass = "bg-green-100 text-green-800";
                            } else if (stringValue.toLowerCase() === "absent") {
                              statusClass = "bg-red-100 text-red-800";
                            } else if (
                              stringValue.toLowerCase().includes("leave") ||
                              stringValue.toLowerCase() === "l"
                            ) {
                              statusClass = "bg-blue-100 text-blue-800";
                            } else if (
                              stringValue.toLowerCase().includes("half") ||
                              stringValue === "1/2"
                            ) {
                              statusClass = "bg-yellow-100 text-yellow-800";
                            } else if (
                              stringValue.toLowerCase().includes("outside") ||
                              stringValue.toLowerCase() === "od"
                            ) {
                              statusClass = "bg-orange-100 text-orange-800";
                            } else {
                              statusClass = "bg-gray-100 text-gray-800";
                            }

                            return (
                              <td
                                key={cellIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm"
                              >
                                {stringValue.toLowerCase() === "present" ||
                                stringValue.toLowerCase() === "absent" ||
                                stringValue.toLowerCase().includes("leave") ||
                                stringValue.toLowerCase() === "l" ||
                                stringValue.toLowerCase().includes("half") ||
                                stringValue === "1/2" ||
                                stringValue.toLowerCase().includes("outside") ||
                                stringValue.toLowerCase() === "od" ? (
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
                                  >
                                    {stringValue}
                                  </span>
                                ) : (
                                  stringValue
                                )}
                              </td>
                            );
                          }
                        )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No leave data available
            </div>
          )}
        </div>

        {/* Summary Report Preview */}
        <div>
          <h3 className="text-lg font-bold mb-4 pb-2 border-b">
            Summary Report Preview
          </h3>
          {previewData.summary && previewData.summary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {previewData.summary[0] &&
                      Object.keys(previewData.summary[0]).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.summary.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {row &&
                        Object.entries(row).map(
                          ([key, value]: [string, any], cellIndex: number) => {
                            const stringValue = String(value);
                            let statusClass = "";

                            if (stringValue.toLowerCase() === "present") {
                              statusClass = "bg-green-100 text-green-800";
                            } else if (stringValue.toLowerCase() === "absent") {
                              statusClass = "bg-red-100 text-red-800";
                            } else if (
                              stringValue.toLowerCase().includes("leave") ||
                              stringValue.toLowerCase() === "l"
                            ) {
                              statusClass = "bg-blue-100 text-blue-800";
                            } else if (
                              stringValue.toLowerCase().includes("half") ||
                              stringValue === "1/2"
                            ) {
                              statusClass = "bg-yellow-100 text-yellow-800";
                            } else if (
                              stringValue.toLowerCase().includes("outside") ||
                              stringValue.toLowerCase() === "od"
                            ) {
                              statusClass = "bg-orange-100 text-orange-800";
                            } else {
                              statusClass = "bg-gray-100 text-gray-800";
                            }

                            return (
                              <td
                                key={cellIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm"
                              >
                                {stringValue.toLowerCase() === "present" ||
                                stringValue.toLowerCase() === "absent" ||
                                stringValue.toLowerCase().includes("leave") ||
                                stringValue.toLowerCase() === "l" ||
                                stringValue.toLowerCase().includes("half") ||
                                stringValue === "1/2" ||
                                stringValue.toLowerCase().includes("outside") ||
                                stringValue.toLowerCase() === "od" ? (
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
                                  >
                                    {stringValue}
                                  </span>
                                ) : (
                                  stringValue
                                )}
                              </td>
                            );
                          }
                        )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No summary data available
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl shadow-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500"></div>
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
          >
            <path
              d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 12H15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 16H15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {reportTitle}
        </h1>
        <div className="flex flex-wrap gap-6 mb-4">
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-lg p-3">
            <strong className="text-xs uppercase tracking-wide block mb-1 opacity-80">
              Report Type
            </strong>
            <span className="font-medium">
              {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
            </span>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-lg p-3">
            <strong className="text-xs uppercase tracking-wide block mb-1 opacity-80">
              Date Range
            </strong>
            <span className="font-medium">
              {format(new Date(startDate), "MMM d, yyyy")} -{" "}
              {format(new Date(endDate), "MMM d, yyyy")}
            </span>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-lg p-3">
            <strong className="text-xs uppercase tracking-wide block mb-1 opacity-80">
              Records
            </strong>
            <span className="font-medium">
              {Array.isArray(previewData)
                ? previewData.length
                : (
                    previewData as {
                      attendance: any[];
                      leave: any[];
                      summary: any[];
                    }
                  )?.attendance?.length ||
                  0 +
                    (
                      previewData as {
                        attendance: any[];
                        leave: any[];
                        summary: any[];
                      }
                    )?.leave?.length ||
                  0 +
                    (
                      previewData as {
                        attendance: any[];
                        leave: any[];
                        summary: any[];
                      }
                    )?.summary?.length ||
                  0}{" "}
              Records
            </span>
          </div>
        </div>
        <div className="inline-block bg-blue-500 bg-opacity-25 rounded-full px-4 py-1 text-sm">
          Filter: {filterText}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {previewData &&
        (Array.isArray(previewData)
          ? previewData.length > 0
          : (previewData as { attendance: any[]; leave: any[]; summary: any[] })
              .attendance?.length > 0 ||
            (previewData as { attendance: any[]; leave: any[]; summary: any[] })
              .leave?.length > 0 ||
            (previewData as { attendance: any[]; leave: any[]; summary: any[] })
              .summary?.length > 0) ? (
          reportType === "combined" ? (
            renderCombinedReport()
          ) : (
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {reportType === "attendance" ? (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee Name
                        </th>
                        {dateHeaders.map((date, index) => (
                          <th
                            key={index}
                            className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider day-header"
                          >
                            {format(date, "MMM d")}
                          </th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Days
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Present Days
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Absent Days
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </>
                    ) : (
                      Array.isArray(previewData) &&
                      previewData[0] &&
                      Object.keys(previewData[0]).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(previewData) &&
                    previewData.map((row: any, rowIndex: number) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {reportType === "attendance" ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {row["Employee ID"] || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 employee-cell">
                              {row["Employee Name"] || "-"}
                            </td>
                            {dateHeaders.map((date, dateIndex) => {
                              const dayKey = `Day ${date.getDate()}`;
                              const status = row[dayKey] || "A";
                              let statusClass = "";

                              switch (status) {
                                case "P":
                                  statusClass = "bg-green-100 text-green-800";
                                  break;
                                case "A":
                                  statusClass = "bg-red-100 text-red-800";
                                  break;
                                case "L":
                                  statusClass = "bg-blue-100 text-blue-800";
                                  break;
                                case "1/2":
                                  statusClass = "bg-yellow-100 text-yellow-800";
                                  break;
                                case "OD":
                                  statusClass = "bg-orange-100 text-orange-800";
                                  break;
                                default:
                                  statusClass = "bg-gray-100 text-gray-800";
                              }

                              return (
                                <td
                                  key={dateIndex}
                                  className={`px-2 py-4 whitespace-nowrap text-sm text-center font-medium day-cell ${statusClass} rounded`}
                                >
                                  {status}
                                </td>
                              );
                            })}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {row["Total Office Working Days"] || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {row["Employee Present Days"] || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {row["Employee Absent Days"] || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`status-cell px-2 py-1 rounded-full text-xs font-medium ${
                                  (row["Employee Present Days"] || 0) >
                                  (row["Employee Absent Days"] || 0)
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {(row["Employee Present Days"] || 0) >
                                (row["Employee Absent Days"] || 0)
                                  ? "Present"
                                  : "Absent"}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            {row &&
                              Object.entries(row).map(
                                (
                                  [key, value]: [string, any],
                                  cellIndex: number
                                ) => {
                                  const stringValue = String(value);
                                  let statusClass = "";

                                  if (stringValue.toLowerCase() === "present") {
                                    statusClass = "bg-green-100 text-green-800";
                                  } else if (
                                    stringValue.toLowerCase() === "absent"
                                  ) {
                                    statusClass = "bg-red-100 text-red-800";
                                  } else if (
                                    stringValue
                                      .toLowerCase()
                                      .includes("leave") ||
                                    stringValue.toLowerCase() === "l"
                                  ) {
                                    statusClass = "bg-blue-100 text-blue-800";
                                  } else if (
                                    stringValue
                                      .toLowerCase()
                                      .includes("half") ||
                                    stringValue === "1/2"
                                  ) {
                                    statusClass =
                                      "bg-yellow-100 text-yellow-800";
                                  } else if (
                                    stringValue
                                      .toLowerCase()
                                      .includes("outside") ||
                                    stringValue.toLowerCase() === "od"
                                  ) {
                                    statusClass =
                                      "bg-orange-100 text-orange-800";
                                  } else {
                                    statusClass = "bg-gray-100 text-gray-800";
                                  }

                                  return (
                                    <td
                                      key={cellIndex}
                                      className="px-6 py-4 whitespace-nowrap text-sm"
                                    >
                                      {stringValue.toLowerCase() ===
                                        "present" ||
                                      stringValue.toLowerCase() === "absent" ||
                                      stringValue
                                        .toLowerCase()
                                        .includes("leave") ||
                                      stringValue.toLowerCase() === "l" ||
                                      stringValue
                                        .toLowerCase()
                                        .includes("half") ||
                                      stringValue === "1/2" ||
                                      stringValue
                                        .toLowerCase()
                                        .includes("outside") ||
                                      stringValue.toLowerCase() === "od" ? (
                                        <span
                                          className={`status-cell px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
                                        >
                                          {stringValue}
                                        </span>
                                      ) : (
                                        stringValue
                                      )}
                                    </td>
                                  );
                                }
                              )}
                          </>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16 mx-auto opacity-30 mb-4"
            >
              <path
                d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 12H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 16H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              No Data Available
            </h3>
            <p className="text-gray-500">
              No records found for the selected filters and date range.
            </p>
          </div>
        )}
      </div>

      <div className="text-center py-4 text-gray-500 text-sm border-t mt-6">
        <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
        <p>© 2023 Geo-Fence Attendance System</p>
      </div>
    </div>
  );
}
