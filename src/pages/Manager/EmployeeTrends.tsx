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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Loader2, Calendar, User, TrendingUp } from "lucide-react";
import { managerAPI } from "@/services/api";
import { format } from "date-fns";
import type { AttendanceRecord } from "@/types";

interface EmployeeTrendData {
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingHours: number;
}

interface TeamMember {
  id: string;
  empId: string;
  name: string;
  email: string;
}

export default function EmployeeTrends() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employeeTrends, setEmployeeTrends] = useState<EmployeeTrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Fetch team members when component mounts
  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await managerAPI.getTeamMembers();
      if (response.success && response.data) {
        setTeamMembers(response.data.employees);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch team members:", err);
      setError("Failed to load team members. Please try again later.");
    }
  };

  const fetchEmployeeTrends = async () => {
    if (!selectedEmployee) {
      setError("Please select an employee");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const trendsData: EmployeeTrendData[] = [];
      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      // Get the selected employee details
      const employee = teamMembers.find((emp) => emp.id === selectedEmployee);
      if (employee) {
        setEmployeeName(`${employee.name} (${employee.empId})`);
      }

      // Fetch data for each date in the range
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];

        try {
          const response = await managerAPI.getTeamAttendance(dateStr);

          if (response.success && response.data) {
            // Find the attendance record for the selected employee
            const employeeRecord = response.data.team.find(
              (teamMember: any) => teamMember.employee.id === selectedEmployee
            );

            if (employeeRecord) {
              const attendance = employeeRecord.attendance;
              trendsData.push({
                date: dateStr,
                status: attendance.status,
                checkInTime: attendance.checkInTime,
                checkOutTime: attendance.checkOutTime,
                workingHours: attendance.workingHours || 0,
              });
            } else {
              // If no record found, add an absent record
              trendsData.push({
                date: dateStr,
                status: "absent",
                checkInTime: null,
                checkOutTime: null,
                workingHours: 0,
              });
            }
          }
        } catch (err: unknown) {
          console.error(`Failed to fetch data for ${dateStr}:`, err);
          // Add an absent record for failed dates
          trendsData.push({
            date: dateStr,
            status: "absent",
            checkInTime: null,
            checkOutTime: null,
            workingHours: 0,
          });
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setEmployeeTrends(trendsData);
    } catch (err: unknown) {
      console.error("Failed to fetch employee trends data:", err);
      setError("Failed to fetch employee trends data. Please try again later.");
      setEmployeeTrends([]);
      setEmployeeName("");
    } finally {
      setLoading(false);
    }
  };

  // Transform data for charts
  const chartData = employeeTrends.map((record) => ({
    date: record.date ? format(new Date(record.date), "MMM dd") : "N/A",
    workingHours: record.workingHours / 60, // Convert to hours
    status: record.status || "N/A",
    statusValue: record.status === "present" ? 1 : 0, // For line chart
  }));

  // Calculate summary statistics
  const presentDays = employeeTrends.filter(
    (r) => r.status === "present"
  ).length;
  const absentDays = employeeTrends.filter((r) => r.status === "absent").length;
  const totalHours =
    employeeTrends.reduce((sum, day) => sum + day.workingHours, 0) / 60;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Employee Trends</h2>
        <p className="text-muted-foreground">
          Analyze attendance patterns for individual employees
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Selection</CardTitle>
          <CardDescription>
            Select an employee and date range to analyze trends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {teamMembers.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.empId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchEmployeeTrends}
                disabled={loading || !selectedEmployee}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4 mr-2" />
                )}
                Analyze Trends
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            {employeeName || "Select an employee to analyze"}
          </CardTitle>
          <CardDescription>
            Attendance trends for selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{presentDays}</p>
              <p className="text-sm text-muted-foreground">Days Present</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{absentDays}</p>
              <p className="text-sm text-muted-foreground">Days Absent</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {totalHours.toFixed(1)}h
              </p>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Working Hours</CardTitle>
          <CardDescription>
            Working hours trend for the selected employee
          </CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading employee trends...</span>
            </div>
          ) : employeeTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  label={{
                    value: "Hours",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  formatter={(value) => [`${value} hours`, "Working Hours"]}
                />
                <Legend />
                <Bar
                  dataKey="workingHours"
                  fill="#3B82F6"
                  name="Working Hours"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p>Select an employee and date range to view trends</p>
                <p className="text-sm mt-2">
                  Please select an employee and date range to analyze
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Status Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Status</CardTitle>
          <CardDescription>Attendance status trend over time</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading employee trends...</span>
            </div>
          ) : employeeTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(value) =>
                    value === 1 ? "Present" : "Absent"
                  }
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    props.payload.status === "present" ? "Present" : "Absent",
                    "Status",
                  ]}
                />
                <Legend />
                <Line
                  type="stepAfter"
                  dataKey="statusValue"
                  stroke="#10B981"
                  name="Attendance Status"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p>Select an employee and date range to view trends</p>
                <p className="text-sm mt-2">
                  Please select an employee and date range to analyze
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
