import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { managerAPI } from "@/services/api";
import { format } from "date-fns";
import type { LeaveRequest } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

export default function LeaveApprovals() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");

  // Removed auto-fetch on component mount as per optimization requirements
  // Data will only be fetched when user explicitly clicks the Refresh button

  const fetchLeaveRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await managerAPI.getTeamLeaveRequests();
      if (response.success && response.data) {
        // Filter out approved/rejected requests older than 24 hours
        const filteredRequests = response.data.leaveRequests.filter(
          (request: LeaveRequest) => {
            // Always show pending requests
            if (request.status === "pending") return true;

            // For approved/rejected requests, check if they're within 24 hours
            const createdAt = new Date(request.createdAt);
            const now = new Date();
            const hoursDifference =
              (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

            // Show approved/rejected requests if they're less than 24 hours old
            return hoursDifference < 24;
          }
        );
        setLeaveRequests(filteredRequests);
      } else {
        // Set empty array if no data
        setLeaveRequests([]);
      }
    } catch (err: unknown) {
      setError("Failed to fetch leave requests. Showing N/A values.");
      toast.error("Failed to fetch leave requests", {
        description: "Could not load leave requests. Please try again.",
      });
      // Set empty array on error
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const response = await managerAPI.getTeamLeaveRequests();
      if (response.success && response.data) {
        // Filter out approved/rejected requests older than 24 hours
        const filteredRequests = response.data.leaveRequests.filter(
          (request: LeaveRequest) => {
            // Always show pending requests
            if (request.status === "pending") return true;

            // For approved/rejected requests, check if they're within 24 hours
            const createdAt = new Date(request.createdAt);
            const now = new Date();
            const hoursDifference =
              (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

            // Show approved/rejected requests if they're less than 24 hours old
            return hoursDifference < 24;
          }
        );
        setLeaveRequests(filteredRequests);
      } else {
        // Set empty array if no data
        setLeaveRequests([]);
      }
    } catch (err: unknown) {
      setError("Failed to refresh leave requests. Showing N/A values.");
      toast.error("Failed to refresh leave requests", {
        description: "Could not load leave requests. Please try again.",
      });
      // Set empty array on error
      setLeaveRequests([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLeaveAction = async (
    id: string,
    status: string,
    rejectionReason?: string
  ) => {
    try {
      const response = await managerAPI.updateLeaveRequest(
        id,
        status,
        rejectionReason
      );
      if (response.success) {
        setMessage(`Leave request ${status} successfully`);
        toast.success(`Leave request ${status}`, {
          description: `Leave request has been ${status} successfully.`,
        });
        fetchLeaveRequests();
        // Clear message after 3 seconds
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err: unknown) {
      setError("Failed to update leave request");
      toast.error("Failed to update leave request", {
        description: "Please try again.",
      });
    }
  };

  const openRejectDialog = (id: string) => {
    setSelectedRequestId(id);
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (selectedRequestId) {
      await handleLeaveAction(selectedRequestId, "rejected");
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedRequestId(null);
      toast.success("Leave request rejected", {
        description: "Leave request has been rejected successfully.",
      });
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case "sick":
        return (
          <Badge variant="default" className="bg-rose-500 text-rose-50">
            Sick
          </Badge>
        );
      case "personal":
        return (
          <Badge variant="default" className="bg-sky-500 text-sky-50">
            Personal
          </Badge>
        );
      case "vacation":
        return (
          <Badge variant="default" className="bg-indigo-500 text-indigo-50">
            Vacation
          </Badge>
        );
      case "emergency":
        return (
          <Badge variant="default" className="bg-red-500 text-red-50">
            Emergency
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type || "N/A"}</Badge>;
    }
  };

  // Function to get status badge with appropriate colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="default" className="bg-amber-500 text-amber-50">
            Pending
          </Badge>
        );
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
      default:
        return <Badge variant="secondary">{status || "N/A"}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Leave Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve/reject leave requests from your team
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="alert-modern">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="alert-modern">
          <AlertDescription className="text-green-500">
            {message}
          </AlertDescription>
        </Alert>
      )}

      <Card className="card-modern">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Pending Leave Requests</CardTitle>
              <CardDescription>
                Leave requests awaiting your approval
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
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No pending leave requests.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div
                  key={request._id}
                  className="p-4 border rounded-lg bg-secondary/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {request.userId.name || "N/A"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {request.userId.empId || "N/A"}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <strong>Type:</strong>{" "}
                          {getLeaveTypeBadge(request.type)}
                        </p>
                        <p className="text-sm">
                          <strong>Dates:</strong>{" "}
                          {request.startDate
                            ? format(new Date(request.startDate), "MMM d, yyyy")
                            : "N/A"}{" "}
                          to{" "}
                          {request.endDate
                            ? format(new Date(request.endDate), "MMM d, yyyy")
                            : "N/A"}{" "}
                          ({request.days || "N/A"} days)
                        </p>
                        <p className="text-sm">
                          <strong>Reason:</strong> {request.reason || "N/A"}
                        </p>
                        {request.status === "rejected" &&
                          request.rejectionReason && (
                            <p className="text-sm text-red-500">
                              <strong>Rejection Reason:</strong>{" "}
                              {request.rejectionReason}
                            </p>
                          )}
                        <p className="text-xs text-muted-foreground">
                          Requested:{" "}
                          {request.createdAt
                            ? format(
                                new Date(request.createdAt),
                                "MMM d, yyyy HH:mm"
                              )
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end space-y-2">
                      {getStatusBadge(request.status)}
                      {request.status === "pending" && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleLeaveAction(request._id, "approved")
                            }
                            className="btn-primary"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectDialog(request._id)}
                            className="btn-destructive"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[425px] card-modern">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              You can optionally provide a reason for rejecting this leave
              request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="input-modern"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              className="btn-destructive"
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
