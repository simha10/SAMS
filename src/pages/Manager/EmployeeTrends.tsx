import { useState, useEffect, useCallback } from "react";
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
  Legend as RechartsLegend,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Loader2,
  Calendar,
  User,
  TrendingUp,
  Clock,
  Target,
  Award,
} from "lucide-react";
import { managerAPI } from "@/services/api";
import { format } from "date-fns";
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

// Custom tooltip component for better visualization
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function EmployeeTrends() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
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
        // Map employees to include id field (backend returns _id)
        const mappedEmployees = response.data.employees.map((emp: any) => ({
          ...emp,
          id: emp._id,
        }));
        setTeamMembers(mappedEmployees);
        console.log("Team members fetched:", mappedEmployees);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch team members:", err);
      setError("Failed to load team members. Please try again later.");
    }
  };

  const handleEmployeeChange = useCallback(
    (value: string) => {
      console.log("Employee selected:", value);
      setSelectedEmployee(value);
      // Find and set employee name for display
      const employee = teamMembers.find((emp) => emp.id === value);
      if (employee) {
        setEmployeeName(`${employee.name} (${employee.empId})`);
      }
    },
    [teamMembers]
  );

  const fetchEmployeeTrends = async () => {
    console.log("Fetch employee trends called with:", {
      selectedEmployee,
      startDate,
      endDate,
    });

    if (!selectedEmployee) {
      setError("Please select an employee");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Generate date range array
      const dates: string[] = [];
      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Fetch data for all dates in parallel
      const promises = dates.map((date) =>
        managerAPI.getTeamAttendance(date).catch((err) => {
          console.error(`Failed to fetch data for ${date}:`, err);
          return null; // Return null for failed requests
        })
      );

      const responses = await Promise.all(promises);

      // Process responses
      const trendsData: EmployeeTrendData[] = [];

      responses.forEach((response, index) => {
        const dateStr = dates[index];

        if (response && response.success && response.data) {
          // Find the attendance record for the selected employee
          const employeeRecord = response.data.team.find(
            (teamMember: any) => teamMember.employee.id === selectedEmployee
          );

          if (employeeRecord) {
            const attendance = employeeRecord.attendance;
            trendsData.push({
              date: dateStr,
              status: attendance.status || "absent",
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
        } else {
          // Add an absent record for failed dates
          trendsData.push({
            date: dateStr,
            status: "absent",
            checkInTime: null,
            checkOutTime: null,
            workingHours: 0,
          });
        }
      });

      setEmployeeTrends(trendsData);
      console.log("Employee trends data set:", trendsData);
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
    checkInTime: record.checkInTime,
    checkOutTime: record.checkOutTime,
  }));

  // Calculate summary statistics
  const presentDays = employeeTrends.filter(
    (r) => r.status === "present"
  ).length;
  const absentDays = employeeTrends.filter((r) => r.status === "absent").length;
  const totalHours =
    employeeTrends.reduce((sum, day) => sum + day.workingHours, 0) / 60;

  // Calculate average working hours per day (for present days only)
  const presentDaysData = employeeTrends.filter((r) => r.status === "present");
  const avgWorkingHours =
    presentDaysData.length > 0
      ? presentDaysData.reduce((sum, day) => sum + day.workingHours, 0) /
        presentDaysData.length /
        60
      : 0;

  // Calculate consistency score (based on regular working hours)
  const consistencyScore =
    presentDaysData.length > 0
      ? (presentDaysData.filter(
          (day) => day.workingHours >= 420 && day.workingHours <= 540
        ).length /
          presentDaysData.length) *
        100
      : 0;

  // Log state for debugging
  useEffect(() => {
    console.log("EmployeeTrends state updated:", {
      selectedEmployee,
      loading,
      teamMembers: teamMembers.length,
      employeeTrends: employeeTrends.length,
    });
  }, [selectedEmployee, loading, teamMembers, employeeTrends]);

  // Log when the button state changes
  useEffect(() => {
    const isButtonDisabled = loading || !selectedEmployee;
    console.log("Analyze Trends button state:", {
      disabled: isButtonDisabled,
      loading,
      selectedEmployee,
      selectedEmployeeTruthy: !!selectedEmployee,
    });
  }, [loading, selectedEmployee]);

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
                onValueChange={handleEmployeeChange}
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

      {/* Employee Info and Enhanced Stats */}
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {avgWorkingHours.toFixed(1)}h
              </p>
              <p className="text-sm text-muted-foreground">Avg/Day</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">
                {consistencyScore.toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground">Consistency</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Working Hours Trend - Enhanced Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              Daily Working Hours
            </CardTitle>
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
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
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
                    content={<CustomTooltip />}
                  />
                  <RechartsLegend />
                  <Area
                    type="monotone"
                    dataKey="workingHours"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Working Hours"
                  />
                </AreaChart>
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

        {/* Attendance Status Trend - Enhanced Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-500" />
              Attendance Status
            </CardTitle>
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
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
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
                    content={<CustomTooltip />}
                  />
                  <RechartsLegend />
                  <Line
                    type="stepAfter"
                    dataKey="statusValue"
                    stroke="#10B981"
                    name="Attendance Status"
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#10B981" }}
                    activeDot={{ r: 8, stroke: "#10B981", strokeWidth: 2 }}
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

        {/* Working Hours Distribution - Enhanced Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-500" />
              Working Hours Distribution
            </CardTitle>
            <CardDescription>
              Distribution of working hours across different ranges
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
                <BarChart
                  data={[
                    {
                      range: "< 4h",
                      count: employeeTrends.filter(
                        (r) =>
                          r.status === "present" &&
                          r.workingHours > 0 &&
                          r.workingHours < 240
                      ).length,
                    },
                    {
                      range: "4-6h",
                      count: employeeTrends.filter(
                        (r) =>
                          r.status === "present" &&
                          r.workingHours >= 240 &&
                          r.workingHours <= 360
                      ).length,
                    },
                    {
                      range: "6-8h",
                      count: employeeTrends.filter(
                        (r) =>
                          r.status === "present" &&
                          r.workingHours > 360 &&
                          r.workingHours <= 480
                      ).length,
                    },
                    {
                      range: "8-10h",
                      count: employeeTrends.filter(
                        (r) =>
                          r.status === "present" &&
                          r.workingHours > 480 &&
                          r.workingHours <= 600
                      ).length,
                    },
                    {
                      range: "> 10h",
                      count: employeeTrends.filter(
                        (r) => r.status === "present" && r.workingHours > 600
                      ).length,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <RechartsLegend />
                  <Bar dataKey="count" fill="#8B5CF6" name="Days Count" />
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

        {/* Attendance Pattern Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-amber-500" />
              Attendance Pattern Analysis
            </CardTitle>
            <CardDescription>
              Comparative view of attendance patterns
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
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={[
                    {
                      subject: "Present",
                      A: presentDays,
                      fullMark: employeeTrends.length,
                    },
                    {
                      subject: "Absent",
                      A: absentDays,
                      fullMark: employeeTrends.length,
                    },
                    {
                      subject: "Consistency",
                      A: Math.round(consistencyScore),
                      fullMark: 100,
                    },
                    {
                      subject: "Avg Hours",
                      A: Math.round(avgWorkingHours * 10),
                      fullMark: 100,
                    },
                    {
                      subject: "Total Hours",
                      A: Math.round(totalHours),
                      fullMark: employeeTrends.length * 8,
                    },
                  ]}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Attendance Metrics"
                    dataKey="A"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
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
    </div>
  );
}
