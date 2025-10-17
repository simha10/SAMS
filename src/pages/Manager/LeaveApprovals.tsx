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

export default function LeaveApprovals() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await managerAPI.getTeamLeaveRequests();
      if (response.success && response.data) {
        setLeaveRequests(response.data.leaveRequests);
      } else {
        // Set empty array if no data
        setLeaveRequests([]);
      }
    } catch (err: unknown) {
      setError("Failed to fetch leave requests. Showing N/A values.");
      // Set empty array on error
      setLeaveRequests([]);
    } finally {
      setLoading(false);
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
        fetchLeaveRequests();
        // Clear message after 3 seconds
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err: unknown) {
      setError("Failed to update leave request");
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
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case "sick":
        return <Badge variant="destructive">Sick</Badge>;
      case "personal":
        return <Badge variant="secondary">Personal</Badge>;
      case "vacation":
        return (
          <Badge variant="default" className="bg-blue-500">
            Vacation
          </Badge>
        );
      case "emergency":
        return (
          <Badge variant="default" className="bg-red-500">
            Emergency
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type || "N/A"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leave Approvals</h1>
        <p className="text-gray-600">
          Review and approve/reject leave requests from your team
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert>
          <AlertDescription className="text-green-600">
            {message}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
          <CardDescription>
            Leave requests awaiting your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading leave requests...</span>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending leave requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div key={request._id} className="p-4 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {request.userId.name || "N/A"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.userId.empId || "N/A"} •{" "}
                        {request.userId.email || "N/A"}
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
                            <p className="text-sm text-red-600">
                              <strong>Rejection Reason:</strong>{" "}
                              {request.rejectionReason}
                            </p>
                          )}
                        <p className="text-xs text-gray-500">
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
                      <Badge variant="secondary">
                        {request.status || "N/A"}
                      </Badge>
                      {request.status === "pending" && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleLeaveAction(request._id, "approved")
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectDialog(request._id)}
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
        <DialogContent>
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
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
