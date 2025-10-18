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
import { managerAPI } from "@/services/api";
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
    "on-leave"?: number;
    "half-day"?: number;
    "outside-duty"?: number;
    flagged?: number;
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

interface TeamData {
  date: Date;
  team: any[];
  summary: {
    present: number;
    absent: number;
    flagged: number;
    onLeave: number;
    halfDay: number;
    outsideDuty: number;
  };
}

const COLORS = [
  "#10B981",
  "#EF4444",
  "#F59E0B",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
];

// Function to generate date range
const getDateRange = (days: number) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  return { startDate, endDate };
};

// Function to generate daily trends data
const generateDailyTrends = (
  startDate: Date,
  endDate: Date,
  teamData: TeamData[]
) => {
  const trends = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dayData = teamData.filter(
      (data) => data.date && data.date.toISOString().split("T")[0] === dateStr
    );

    const present = dayData.reduce(
      (sum, d) => sum + (d.summary.present || 0),
      0
    );
    const absent = dayData.reduce((sum, d) => sum + (d.summary.absent || 0), 0);
    const flagged = dayData.reduce(
      (sum, d) => sum + (d.summary.flagged || 0),
      0
    );

    trends.push({
      _id: dateStr,
      present: present || 0,
      absent: absent || 0,
      flagged: flagged || 0,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trends;
};

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
      const days = parseInt(selectedRange);
      const { startDate, endDate } = getDateRange(days);

      // For manager analytics, we need to fetch data differently
      // We'll fetch team attendance for each day in the range
      const teamData: TeamData[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        try {
          const response = await managerAPI.getTeamAttendance(dateStr);
          if (response.success && response.data) {
            teamData.push({
              date: new Date(dateStr),
              team: response.data.team,
              summary: response.data.summary,
            });
          }
        } catch (err) {
          console.warn(`Failed to fetch data for ${dateStr}:`, err);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Calculate overall stats
      let totalEmployees = 0;
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalFlagged = 0;
      let totalRecords = 0;

      // Get unique employees
      const employeeSet = new Set();
      teamData.forEach((data) => {
        data.team.forEach((member: any) => {
          employeeSet.add(member.employee.id);
        });
      });

      totalEmployees = employeeSet.size;

      // Calculate attendance stats
      let presentCount = 0;
      let absentCount = 0;
      let flaggedCount = 0;

      teamData.forEach((data) => {
        presentCount += data.summary.present || 0;
        absentCount += data.summary.absent || 0;
        flaggedCount += data.summary.flagged || 0;
      });

      totalPresent = presentCount;
      totalAbsent = absentCount;
      totalFlagged = flaggedCount;
      totalRecords = presentCount + absentCount;
      const overallAttendanceRate =
        totalRecords > 0
          ? Math.round((presentCount / totalRecords) * 1000) / 10
          : 0;

      // Generate daily trends
      const dailyTrends = generateDailyTrends(startDate, endDate, teamData);

      // For top performers, we'll need to aggregate data differently
      const topPerformers: InsightsData["topPerformers"] = []; // We'll implement this later

      setInsights({
        period: {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          days,
        },
        overview: {
          totalEmployees,
          overallAttendanceRate,
          totalAttendanceRecords: totalRecords,
        },
        attendanceStats: {
          present: totalPresent,
          absent: totalAbsent,
          flagged: totalFlagged,
        },
        dailyTrends,
        topPerformers,
      });
    } catch (err: unknown) {
      console.error("Failed to fetch analytics data:", err);
      setError("Failed to fetch analytics data. Please try again later.");
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
          "on-leave": 0,
          "half-day": 0,
          "outside-duty": 0,
          flagged: 0,
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

  const pieData = insights
    ? Object.entries(insights.attendanceStats)
        .filter(([key, value]) => value && value > 0)
        .map(([key, value]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " "),
          value: value as number,
        }))
    : [];

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
            <Calendar className="w-4 h-4 mr-2 text-blue-200" />
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
              <Calendar className="h-4 w-4 text-blue-200" />
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
              ) : pieData.length > 0 ? (
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
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading top performers...</span>
              </div>
            ) : insights && insights.topPerformers.length > 0 ? (
              <div className="space-y-4">
                {insights.topPerformers.slice(0, 5).map((performer, index) => (
                  <div
                    key={performer.empId || index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary" className="text-lg">
                        {index + 1}
                      </Badge>
                      <div>
                        <h3 className="font-medium">
                          {performer.name || "N/A"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
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
                      <p className="text-sm text-muted-foreground">
                        Attendance Rate
                      </p>
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
