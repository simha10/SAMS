import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Inbox } from "lucide-react";
import { leaveAPI } from "@/services/api";
import type { LeaveRequest } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "@/components/ui/sonner";

export default function Requests() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchLeaveRequests = async () => {
    console.log("=== FETCH LEAVE REQUESTS STARTED ===");
    setLoading(true);
    setError("");

    try {
      const response = await leaveAPI.getMyLeaveRequests();
      console.log("Leave requests API response:", response);

      if (response.success && response.data) {
        setLeaveRequests(response.data.leaveRequests);
        setHasInitiallyLoaded(true);
        console.log(
          "Set leave requests count:",
          response.data.leaveRequests.length
        );
      }
    } catch (err) {
      console.error("=== FETCH LEAVE REQUESTS ERROR ===");
      console.error("Error:", err);
      setError("Failed to fetch leave requests");
      console.error("Error fetching leave requests:", err);
      console.log("=== END FETCH LEAVE REQUESTS ERROR ===");
    } finally {
      setLoading(false);
      console.log("=== FETCH LEAVE REQUESTS COMPLETED ===");
    }
  };

  const handleRefresh = async () => {
    console.log("=== REFRESH LEAVE REQUESTS STARTED ===");
    setRefreshing(true);
    setError("");

    try {
      const response = await leaveAPI.getMyLeaveRequests();
      console.log("Leave requests API response:", response);

      if (response.success && response.data) {
        setLeaveRequests(response.data.leaveRequests);
        setHasInitiallyLoaded(true);
        console.log(
          "Set leave requests count:",
          response.data.leaveRequests.length
        );
      }
    } catch (err) {
      console.error("=== REFRESH LEAVE REQUESTS ERROR ===");
      console.error("Error:", err);
      setError("Failed to refresh leave requests");
      console.error("Error refreshing leave requests:", err);
      console.log("=== END REFRESH LEAVE REQUESTS ERROR ===");
    } finally {
      setRefreshing(false);
      console.log("=== REFRESH LEAVE REQUESTS COMPLETED ===");
    }
  };

  const getStatusBadge = (status: string) => {
    console.log("Getting status badge for:", status);

    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-emerald-500 text-emerald-50">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="default" className="bg-rose-500 text-rose-50">
            Rejected
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge variant="default" className="bg-amber-500 text-amber-50">
            Pending
          </Badge>
        );
    }
  };

  // Removed auto-fetch on component mount as per optimization requirements
  // Data will only be fetched when user explicitly clicks the Refresh button

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return format(start, "MMM d, yyyy");
    }
    
    return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
  };

  console.log("=== REQUESTS COMPONENT RENDER ===");
  console.log("State:", {
    leaveRequestsCount: leaveRequests.length,
    loading,
    error,
  });

  return (
    <div className="space-y-6 p-4 border-2 border-white rounded-lg">
      <div>
        <h1 className="text-2xl font-bold">My Requests</h1>
        <p className="text-muted-foreground">
          View your leave requests and other requests
        </p>
      </div>

      <Card className="card-modern">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>
                Your submitted leave requests and their status
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh} 
              disabled={loading || refreshing}
              className="flex items-center btn-secondary bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
            >
              {refreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Refreshing...
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading leave requests...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : !hasInitiallyLoaded ? (
            <div className="text-center py-12">
              <Inbox className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Requests Not Loaded</h3>
              <p className="mt-2 text-muted-foreground">
                Click the Refresh button to load your leave requests.
              </p>
              <Button className="mt-4" onClick={handleRefresh}>
                Load Requests
              </Button>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No Requests Found</h3>
              <p className="mt-2 text-muted-foreground">
                You haven't submitted any leave requests yet.
              </p>
              <Button className="mt-4">Submit New Request</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <Card key={request._id} className="card-modern">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-medium">
                          {formatDateRange(request.startDate, request.endDate)}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Leave
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Submitted: {format(new Date(request.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                    
                    {request.reason && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm">{request.reason}</p>
                      </div>
                    )}
                    
                    {request.status === "rejected" && request.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-200">
                        <span className="font-medium">Rejection Reason:</span>{" "}
                        {request.rejectionReason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}