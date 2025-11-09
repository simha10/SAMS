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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Loader2,
  Calendar,
  TrendingUp,
  Users,
  Target,
  Award,
  AlertTriangle,
} from "lucide-react";
import { managerAPI } from "@/services/api";
interface TeamTrendData {
  date: string;
  present: number;
  absent: number;
  flagged: number;
  onLeave: number;
  halfDay: number;
  outsideDuty: number;
  total: number;
  attendanceRate: number;
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

const COLORS = [
  "#10B981",
  "#EF4444",
  "#F59E0B",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
];

export default function TeamTrends() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [teamTrends, setTeamTrends] = useState<TeamTrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTeamTrends();
  }, [startDate, endDate]);

  const fetchTeamTrends = async () => {
    setLoading(true);
    setError("");

    try {
      // For manager team trends, we need to fetch data for each date in the range
      const trendsData: TeamTrendData[] = [];
      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];

        try {
          const response = await managerAPI.getTeamAttendance(dateStr);

          if (response.success && response.data) {
            const summary = response.data.summary;
            const present = summary.present || 0;
            const absent = summary.absent || 0;
            const flagged = summary.flagged || 0;
            const onLeave = summary.onLeave || 0;
            const halfDay = summary.halfDay || 0;
            const outsideDuty = summary.outsideDuty || 0;
            const total =
              present + absent + flagged + onLeave + halfDay + outsideDuty;
            const attendanceRate =
              present + absent > 0 ? (present / (present + absent)) * 100 : 0;

            trendsData.push({
              date: dateStr,
              present,
              absent,
              flagged,
              onLeave,
              halfDay,
              outsideDuty,
              total,
              attendanceRate,
            });
          }
        } catch (err: unknown) {
          console.error(`Failed to fetch data for ${dateStr}:`, err);
          // Add empty record for failed dates
          trendsData.push({
            date: dateStr,
            present: 0,
            absent: 0,
            flagged: 0,
            onLeave: 0,
            halfDay: 0,
            outsideDuty: 0,
            total: 0,
            attendanceRate: 0,
          });
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setTeamTrends(trendsData);
    } catch (err: unknown) {
      console.error("Failed to fetch team trends data:", err);
      setError("Failed to fetch team trends data. Please try again later.");
      // Set empty array on error
      setTeamTrends([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const avgPresent =
    teamTrends.length > 0
      ? teamTrends.reduce((sum, day) => sum + day.present, 0) /
        teamTrends.length
      : 0;

  const avgAbsent =
    teamTrends.length > 0
      ? teamTrends.reduce((sum, day) => sum + day.absent, 0) / teamTrends.length
      : 0;

  const highestRate =
    teamTrends.length > 0
      ? Math.max(...teamTrends.map((day) => day.attendanceRate))
      : 0;

  const lowestRate =
    teamTrends.length > 0
      ? Math.min(...teamTrends.map((day) => day.attendanceRate))
      : 0;

  const totalFlagged =
    teamTrends.length > 0
      ? teamTrends.reduce((sum, day) => sum + day.flagged, 0)
      : 0;

  // Prepare data for pie chart
  const pieData =
    teamTrends.length > 0
      ? [
          {
            name: "Present",
            value: teamTrends.reduce((sum, day) => sum + day.present, 0),
          },
          {
            name: "Absent",
            value: teamTrends.reduce((sum, day) => sum + day.absent, 0),
          },
          {
            name: "Flagged",
            value: teamTrends.reduce((sum, day) => sum + day.flagged, 0),
          },
          {
            name: "On Leave",
            value: teamTrends.reduce((sum, day) => sum + day.onLeave, 0),
          },
          {
            name: "Half Day",
            value: teamTrends.reduce((sum, day) => sum + day.halfDay, 0),
          },
          {
            name: "Outside Duty",
            value: teamTrends.reduce((sum, day) => sum + day.outsideDuty, 0),
          },
        ].filter((item) => item.value > 0)
      : [];

  // Prepare data for radar chart
  const radarData = pieData.map((item) => ({
    status: item.name,
    count: item.value,
    fullMark: Math.max(...pieData.map((d) => d.value)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Team Trends</h2>
        <p className="text-muted-foreground">
          Analyze attendance patterns across your entire team
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>
            Select the period to analyze team trends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="flex items-end">
              <Button onClick={fetchTeamTrends} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4 mr-2" />
                )}
                Update Trends
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Team Trends Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Attendance Trends - Enhanced Stacked Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              Team Attendance Trends
            </CardTitle>
            <CardDescription>
              Daily attendance patterns across your team with detailed breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading team trends...</span>
              </div>
            ) : teamTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={teamTrends}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <RechartsLegend />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Present"
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    stackId="1"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.6}
                    name="Absent"
                  />
                  <Area
                    type="monotone"
                    dataKey="flagged"
                    stackId="1"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.6}
                    name="Flagged"
                  />
                  <Area
                    type="monotone"
                    dataKey="onLeave"
                    stackId="1"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.6}
                    name="On Leave"
                  />
                  <Area
                    type="monotone"
                    dataKey="halfDay"
                    stackId="1"
                    stroke="#06B6D4"
                    fill="#06B6D4"
                    fillOpacity={0.6}
                    name="Half Day"
                  />
                  <Area
                    type="monotone"
                    dataKey="outsideDuty"
                    stackId="1"
                    stroke="#F97316"
                    fill="#F97316"
                    fillOpacity={0.6}
                    name="Outside Duty"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p>No data available for the selected period</p>
                  <p className="text-sm mt-2">
                    Please adjust the date range or try again later
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Attendance Rate - Enhanced Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Team Attendance Rate
            </CardTitle>
            <CardDescription>
              Overall attendance rate trend over time
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading team trends...</span>
              </div>
            ) : teamTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={teamTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Attendance Rate"]}
                    content={<CustomTooltip />}
                  />
                  <RechartsLegend />
                  <Line
                    type="monotone"
                    dataKey="attendanceRate"
                    stroke="#3B82F6"
                    name="Attendance Rate"
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#3B82F6" }}
                    activeDot={{ r: 8, stroke: "#3B82F6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p>No data available for the selected period</p>
                  <p className="text-sm mt-2">
                    Please adjust the date range or try again later
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Distribution - Enhanced Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-500" />
              Attendance Distribution
            </CardTitle>
            <CardDescription>
              Overall distribution of attendance statuses
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading team trends...</span>
              </div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
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
                  <RechartsLegend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p>No data available for the selected period</p>
                  <p className="text-sm mt-2">
                    Please adjust the date range or try again later
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Status Radar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-500" />
              Attendance Status Radar
            </CardTitle>
            <CardDescription>
              Comparative view of attendance statuses across the team
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading team trends...</span>
              </div>
            ) : radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={radarData}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="status" />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, Math.max(...radarData.map((d) => d.fullMark))]}
                  />
                  <Radar
                    name="Attendance Status"
                    dataKey="count"
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
                  <p>No data available for the selected period</p>
                  <p className="text-sm mt-2">
                    Please adjust the date range or try again later
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Present
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPresent.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Average daily present count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Absent
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAbsent.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Average daily absent count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highestRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Best attendance rate day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lowest Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowestRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Worst attendance rate day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFlagged}</div>
            <p className="text-xs text-muted-foreground">
              Flagged attendance records
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
