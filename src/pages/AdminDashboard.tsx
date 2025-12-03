import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Calendar,
  Download,
  LogOut,
  UserPlus,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { adminAPI, authAPI } from "@/services/api";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { User } from "@/types";

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

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRange, setSelectedRange] = useState("30");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Remove auto-refresh useEffect and replace with manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchInsights();
      await fetchUsers();
    } catch (err) {
      setError("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getInsights(selectedRange);
      if (response.success && response.data) {
        setInsights(response.data);
      }
    } catch (err: unknown) {
      setError("Failed to fetch insights");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handleExportAttendance = async () => {
    if (!insights) return;

    try {
      const blob = await adminAPI.exportAttendance(
        insights.period.startDate,
        insights.period.endDate
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${insights.period.startDate}-to-${insights.period.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      setError("Failed to export attendance data");
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      navigate("/login");
    } catch (err) {
      logout();
      navigate("/login");
    }
  };

  const getStatusBadge = (status: string, flagged: boolean) => {
    if (flagged) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Flagged
        </Badge>
      );
    }

    switch (status) {
      case "present":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Absent
          </Badge>
        );
      case "outside-geo":
        return <Badge variant="destructive">Outside Area</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Prepare chart data
  const attendanceChartData = insights
    ? [
        {
          name: "Present",
          value: insights.attendanceStats.present || 0,
          color: "#00C49F",
        },
        {
          name: "Absent",
          value: insights.attendanceStats.absent || 0,
          color: "#FF8042",
        },
        {
          name: "Outside Geo",
          value: insights.attendanceStats["outside-geo"] || 0,
          color: "#FFBB28",
        },
      ].filter((item) => item.value > 0)
    : [];

  const dailyTrendsData =
    insights?.dailyTrends.slice(-14).map((item) => ({
      date: format(new Date(item._id), "MMM dd"),
      present: item.present,
      absent: item.absent,
      flagged: item.flagged,
    })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome, {user?.name} ({user?.empId})
              </p>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => navigate("/manager")}>
                Manager View
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="mb-6">
            <AlertDescription className="text-green-600">
              {message}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Attendance Overview</h2>
              <div className="flex items-center space-x-2">
                <Label>Period:</Label>
                <Select value={selectedRange} onValueChange={setSelectedRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {insights && (
              <>
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
                        {insights.overview.totalEmployees}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Active employees
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Attendance Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {insights.overview.overallAttendanceRate.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Overall attendance
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
                        {insights.overview.totalAttendanceRecords}
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
                      <CardTitle>Daily Trends</CardTitle>
                      <CardDescription>
                        Attendance patterns over the last 14 days
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      {dailyTrendsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyTrendsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                              dataKey="present"
                              fill="#10B981"
                              name="Present"
                            />
                            <Bar
                              dataKey="absent"
                              fill="#EF4444"
                              name="Absent"
                            />
                            <Bar
                              dataKey="flagged"
                              fill="#F59E0B"
                              name="Flagged"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No data available
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
                      {attendanceChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={attendanceChartData}
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
                              {attendanceChartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
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
                          No data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performers */}
                {insights.topPerformers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performers</CardTitle>
                      <CardDescription>
                        Employees with highest attendance rates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {insights.topPerformers.slice(0, 5).map((performer) => (
                          <div
                            key={performer.empId}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div>
                              <h3 className="font-medium">{performer.name}</h3>
                              <p className="text-sm text-gray-600">
                                {performer.empId} • {performer.presentDays} of{" "}
                                {performer.totalDays} days
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {performer.attendanceRate.toFixed(1)}%
                              </p>
                              <p className="text-sm text-gray-600">
                                Attendance Rate
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User List</CardTitle>
                <CardDescription>
                  Manage employee accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">User Management</h3>
                  <p className="mt-2 text-gray-600">
                    View and manage all employee accounts, roles, and
                    permissions.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate("/admin/users")}
                  >
                    Manage Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Reports & Analytics</h2>
              <Button onClick={handleExportAttendance} disabled={!insights}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Reports</CardTitle>
                  <CardDescription>
                    Generate detailed attendance reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium">
                      Attendance Reports
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Generate and export attendance reports for payroll and HR
                      purposes.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => navigate("/manager/reports")}
                    >
                      Generate Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Leave Reports</CardTitle>
                  <CardDescription>
                    Track and analyze leave requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium">Leave Reports</h3>
                    <p className="mt-2 text-gray-600">
                      Monitor leave requests, approvals, and patterns across
                      departments.
                    </p>
                    <Button className="mt-4" disabled>
                      View Leave Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <h2 className="text-2xl font-bold">System Logs</h2>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Attendance Logs</CardTitle>
                <CardDescription>
                  View and analyze detailed attendance tracking information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">Attendance Logs</h3>
                  <p className="mt-2 text-gray-600">
                    Detailed tracking of all employee check-ins and check-outs
                    with location data.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate("/admin/attendance-logs")}
                  >
                    View Attendance Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}