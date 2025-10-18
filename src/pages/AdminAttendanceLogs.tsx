import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  MapPin,
  Clock,
  User,
  Calendar,
  Search,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { adminAPI } from "@/services/api";
import type { ApiError } from "@/types";

interface AttendanceLog {
  _id: string;
  userId: {
    _id: string;
    empId: string;
    name: string;
    email: string;
  };
  attendanceId: string;
  action: "checkin" | "checkout";
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  distanceFromOffice: number;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminAttendanceLogs() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    userId: "",
    action: "all",
    searchTerm: "",
  });

  // Since there's no specific logs endpoint, we'll simulate data or use available endpoints
  useEffect(() => {
    // For now, we'll initialize with empty logs
    // In a real implementation, this would fetch actual attendance logs
    setLogs([]);
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = async () => {
    setFilterLoading(true);
    setError("");

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In a real implementation, this would filter actual data
    setFilterLoading(false);
  };

  const clearFilters = () => {
    setFilters({
      from: "",
      to: "",
      userId: "",
      action: "all",
      searchTerm: "",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    setError("");

    try {
      // Using the available export endpoint with dummy dates for now
      const today = new Date().toISOString().split("T")[0];
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const blob = await adminAPI.exportAttendance(
        lastWeek,
        today,
        filters.userId || undefined
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-logs-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(
        error.response?.data?.message || "Failed to export attendance logs"
      );
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance Logs</h1>
        <p className="text-gray-600">
          Detailed attendance tracking and monitoring
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
          <CardDescription>
            Filter attendance logs by date range, employee, action type, or
            search term
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From Date</Label>
              <Input
                id="from"
                type="date"
                value={filters.from}
                onChange={(e) => handleFilterChange("from", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">To Date</Label>
              <Input
                id="to"
                type="date"
                value={filters.to}
                onChange={(e) => handleFilterChange("to", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">Employee ID</Label>
              <Input
                id="userId"
                placeholder="Enter employee ID"
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => handleFilterChange("action", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="checkin">Check-in</SelectItem>
                  <SelectItem value="checkout">Check-out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchTerm">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="searchTerm"
                  placeholder="Search by name, ID, email, IP..."
                  className="pl-8"
                  value={filters.searchTerm}
                  onChange={(e) =>
                    handleFilterChange("searchTerm", e.target.value)
                  }
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            <div className="flex items-end space-x-2">
              <Button
                onClick={applyFilters}
                disabled={filterLoading}
                className="flex-1"
              >
                {filterLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Apply Filters
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={filterLoading}
              >
                Clear
              </Button>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleExport}
                disabled={exportLoading}
                variant="outline"
                className="flex-1"
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Logs</CardTitle>
          <CardDescription>
            Detailed records of all attendance actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No attendance logs found
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log._id} className="border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{log.userId.name}</span>
                        <Badge variant="secondary">{log.userId.empId}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(
                              new Date(log.timestamp),
                              "MMM d, yyyy h:mm a"
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-600 hover:text-blue-800"
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`,
                                "_blank"
                              )
                            }
                          >
                            View on Map
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-blue-200" />
                          <span>IP: {log.ipAddress}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="capitalize font-medium">
                            Action: {log.action}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <Badge
                        variant={
                          log.action === "checkin" ? "default" : "outline"
                        }
                      >
                        {log.action}
                      </Badge>
                      <span className="text-xs text-gray-500 mt-1">
                        {format(new Date(log.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <p>
                      Location: {log.location.lat.toFixed(6)},{" "}
                      {log.location.lng.toFixed(6)}
                    </p>
                    <p className="truncate">User Agent: {log.userAgent}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
