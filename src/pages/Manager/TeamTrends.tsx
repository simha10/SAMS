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
import { Loader2, Calendar, TrendingUp } from "lucide-react";
import { managerAPI } from "@/services/api";
import { format } from "date-fns";

interface TeamTrendData {
  date: string;
  present: number;
  absent: number;
  flagged: number;
  total: number;
  attendanceRate: number;
}

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
            const total = present + absent + flagged;
            const attendanceRate =
              present + absent > 0 ? (present / (present + absent)) * 100 : 0;

            trendsData.push({
              date: dateStr,
              present,
              absent,
              flagged,
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

      {/* Team Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Attendance Trends</CardTitle>
          <CardDescription>
            Daily attendance patterns across your team
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
              <BarChart data={teamTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#10B981" name="Present" />
                <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                <Bar dataKey="flagged" fill="#F59E0B" name="Flagged" />
              </BarChart>
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

      {/* Attendance Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Team Attendance Rate</CardTitle>
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
              <LineChart data={teamTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Attendance Rate"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="attendanceRate"
                  stroke="#3B82F6"
                  name="Attendance Rate"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
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

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      </div>
    </div>
  );
}
