import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { adminAPI } from "@/services/api";
import { format } from "date-fns";

interface InsightsData {
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  overview: {
    totalEmployees: number;
    overallAttendanceRate: number;
    totalAttendanceRecords: number;
  };
  attendanceStats: {
    present?: number;
    absent?: number;
    "outside-geo"?: number;
  };
  dailyTrends: Array<{
    _id: string;
    present: number;
    absent: number;
    flagged: number;
  }>;
  topPerformers: Array<{
    empId: string;
    name: string;
    attendanceRate: number;
    presentDays: number;
    totalDays: number;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function ManagerAnalytics() {
  const location = useLocation();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [selectedRange, setSelectedRange] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInsights();
  }, [selectedRange]);

  const fetchInsights = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminAPI.getInsights(selectedRange);
      if (response.success && response.data) {
        setInsights(response.data);
      } else {
        // Initialize with default empty data
        setInsights({
          period: {
            startDate: "",
            endDate: "",
            days: 0,
          },
          overview: {
            totalEmployees: 0,
            overallAttendanceRate: 0,
            totalAttendanceRecords: 0,
          },
          attendanceStats: {
            present: 0,
            absent: 0,
            "outside-geo": 0,
          },
          dailyTrends: [],
          topPerformers: [],
        });
      }
    } catch (err: unknown) {
      setError("Failed to fetch analytics data. Showing N/A values.");
      // Initialize with default empty data on error
      setInsights({
        period: {
          startDate: "",
          endDate: "",
          days: 0,
        },
        overview: {
          totalEmployees: 0,
          overallAttendanceRate: 0,
          totalAttendanceRecords: 0,
        },
        attendanceStats: {
          present: 0,
          absent: 0,
          "outside-geo": 0,
        },
        dailyTrends: [],
        topPerformers: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const attendanceData =
    insights?.dailyTrends.map((trend) => ({
      date: trend._id ? format(new Date(trend._id), "MMM dd") : "N/A",
      present: trend.present,
      absent: trend.absent,
      flagged: trend.flagged,
    })) || [];

  const pieData = [
    { name: "Present", value: insights?.attendanceStats.present || 0 },
    { name: "Absent", value: insights?.attendanceStats.absent || 0 },
    {
      name: "Outside Geo",
      value: insights?.attendanceStats["outside-geo"] || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          View attendance trends and analytics for your team
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b">
        <Link to="/manager/analytics">
          <Button
            variant={
              location.pathname === "/manager/analytics" ? "default" : "ghost"
            }
            className="rounded-b-none"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </Button>
        </Link>
        <Link to="/manager/analytics/team">
          <Button
            variant={
              location.pathname === "/manager/analytics/team"
                ? "default"
                : "ghost"
            }
            className="rounded-b-none"
          >
            <Users className="w-4 h-4 mr-2" />
            Team Trends
          </Button>
        </Link>
        <Link to="/manager/analytics/employee">
          <Button
            variant={
              location.pathname === "/manager/analytics/employee"
                ? "default"
                : "ghost"
            }
            className="rounded-b-none"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Employee Trends
          </Button>
        </Link>
      </div>

      {/* Analytics Content */}
      <div className="space-y-6">
        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics Period</CardTitle>
            <CardDescription>
              Select the time period for analytics data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {["7", "30", "90", "365"].map((range) => (
                <Button
                  key={range}
                  variant={selectedRange === range ? "default" : "outline"}
                  onClick={() => setSelectedRange(range)}
                >
                  {range} days
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {insights ? insights.overview.totalEmployees : "NA"}
              </div>
              <p className="text-xs text-muted-foreground">
                Active team members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {insights
                  ? insights.overview.overallAttendanceRate.toFixed(1)
                  : "NA"}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                Overall attendance rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Records
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {insights ? insights.overview.totalAttendanceRecords : "NA"}
              </div>
              <p className="text-xs text-muted-foreground">
                Attendance records
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Trends</CardTitle>
              <CardDescription>
                Attendance patterns over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading analytics data...</span>
                </div>
              ) : attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="present" fill="#10B981" name="Present" />
                    <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                    <Bar dataKey="flagged" fill="#F59E0B" name="Flagged" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <p>No data available</p>
                    <p className="text-sm mt-2">
                      Data will show as "NA" when not available
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Distribution</CardTitle>
              <CardDescription>
                Overall attendance status distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading analytics data...</span>
                </div>
              ) : pieData.some((item) => item.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [value, "Count"]}
                      labelFormatter={(name) => `Status: ${name}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <p>No data available</p>
                    <p className="text-sm mt-2">
                      Data will show as "NA" when not available
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Employees with highest attendance rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insights && insights.topPerformers.length > 0 ? (
              <div className="space-y-4">
                {insights.topPerformers.slice(0, 5).map((performer, index) => (
                  <div
                    key={performer.empId || index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary" className="text-lg">
                        {index + 1}
                      </Badge>
                      <div>
                        <h3 className="font-medium">
                          {performer.name || "N/A"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {performer.empId || "N/A"} •{" "}
                          {performer.presentDays || "N/A"} of{" "}
                          {performer.totalDays || "N/A"} days
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {performer.attendanceRate
                          ? performer.attendanceRate.toFixed(1)
                          : "N/A"}
                        %
                      </p>
                      <p className="text-sm text-gray-600">Attendance Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No top performers data available</p>
                <p className="text-sm mt-2">
                  Data will show as "NA" when not available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
