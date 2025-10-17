import { useState } from "react";
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
import { adminAPI } from "@/services/api";
import { format } from "date-fns";

interface EmployeeTrendData {
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingHours: number;
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

  const fetchEmployeeTrends = async () => {
    if (!selectedEmployee) {
      setError("Please select an employee");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // In a real implementation, you would call an API endpoint to get
      // employee-specific attendance data
      // For now, we'll simulate the data
      const simulatedData: EmployeeTrendData[] = [];
      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        // Simulate different attendance patterns
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (!isWeekend) {
          const status = Math.random() > 0.1 ? "present" : "absent";
          const checkInHour = Math.floor(Math.random() * 3) + 9; // 9-11 AM
          const checkOutHour = Math.floor(Math.random() * 3) + 17; // 5-7 PM

          simulatedData.push({
            date: format(currentDate, "yyyy-MM-dd"),
            status: status,
            checkInTime:
              status === "present"
                ? new Date(
                    currentDate.setHours(checkInHour, 0, 0, 0)
                  ).toISOString()
                : null,
            checkOutTime:
              status === "present"
                ? new Date(
                    currentDate.setHours(checkOutHour, 0, 0, 0)
                  ).toISOString()
                : null,
            workingHours:
              status === "present" ? (checkOutHour - checkInHour) * 60 : 0,
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      setEmployeeTrends(simulatedData);
      setEmployeeName(`John Doe (EMP${Math.floor(Math.random() * 1000) + 1})`);
    } catch (err: unknown) {
      setError("Failed to fetch employee trends data. Showing N/A values.");
      // Set empty array on error
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
  }));

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
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                  <SelectItem value="emp001">John Doe (EMP001)</SelectItem>
                  <SelectItem value="emp002">Jane Smith (EMP002)</SelectItem>
                  <SelectItem value="emp003">
                    Robert Johnson (EMP003)
                  </SelectItem>
                  <SelectItem value="emp004">Emily Davis (EMP004)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchEmployeeTrends} disabled={loading}>
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
              <p className="text-2xl font-bold text-green-600">
                {employeeTrends.length > 0
                  ? employeeTrends.filter((r) => r.status === "present").length
                  : "NA"}
              </p>
              <p className="text-sm text-muted-foreground">Days Present</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {employeeTrends.length > 0
                  ? employeeTrends.filter((r) => r.status === "absent").length
                  : "NA"}
              </p>
              <p className="text-sm text-muted-foreground">Days Absent</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {employeeTrends.length > 0
                  ? (
                      employeeTrends.reduce(
                        (sum, day) => sum + day.workingHours,
                        0
                      ) / 60
                    ).toFixed(1)
                  : "NA"}
                h
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
                  Data will show as "NA" when not available
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
                  dataKey="status"
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
                  Data will show as "NA" when not available
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
