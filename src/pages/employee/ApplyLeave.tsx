import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/authStore";
import { leaveAPI } from "@/services/api";
import { format } from "date-fns";
import type { LeaveRequestData, ApiError } from "@/types";

export default function ApplyLeave() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LeaveRequestData>({
    startDate: "",
    endDate: "",
    reason: "",
    type: "personal",
  });

  const [totalDays, setTotalDays] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Calculate total days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setTotalDays(diffDays);
      } else {
        setTotalDays(0);
      }
    } else {
      setTotalDays(0);
    }
  }, [formData.startDate, formData.endDate]);

  const handleInputChange = (field: keyof LeaveRequestData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.reason && formData.reason.length < 10) {
      setError("Reason must be at least 10 characters long if provided");
      return;
    }

    if (totalDays <= 0) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await leaveAPI.createLeaveRequest(formData);
      if (response.success) {
        setMessage("Leave request submitted successfully!");
        // Reset form
        setFormData({
          startDate: "",
          endDate: "",
          reason: "",
          type: "personal",
        });
        setTotalDays(0);
        // Navigate to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/employee/dashboard");
        }, 2000);
      } else {
        setError(response.message || "Failed to submit leave request");
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(
        error.response?.data?.message || "Failed to submit leave request"
      );
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Apply for Leave</h1>
        <p className="text-gray-600">Submit your leave application</p>
      </div>

      {message && (
        <Alert>
          <AlertDescription className="text-green-600">
            {message}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Official Leave Application Form */}
      <Card className="border-2 border-gray-300">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-xl font-bold text-gray-800">
            LRMC Employee Leave Application
          </CardTitle>
          <CardDescription>
            Official leave request form for LRMC staff members
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Employee Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={user?.name || ""}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empId">Employee ID</Label>
                  <Input
                    id="empId"
                    value={user?.empId || ""}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Leave Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Leave Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Leave Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="personal">Personal Leave</SelectItem>
                      <SelectItem value="vacation">Vacation Leave</SelectItem>
                      <SelectItem value="emergency">Emergency Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">From Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    min={today}
                    value={formData.startDate}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">To Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    min={formData.startDate || today}
                    value={formData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalDays">Total Days</Label>
                  <Input
                    id="totalDays"
                    value={totalDays}
                    disabled
                    className="bg-gray-50 font-semibold"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Reason Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Reason for Leave
              </h3>
              <div className="space-y-2">
                <Label htmlFor="reason">Detailed Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a detailed reason for your leave request..."
                  value={formData.reason}
                  onChange={(e) => handleInputChange("reason", e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Application Date */}
            <div className="space-y-2">
              <Label>Application Date</Label>
              <Input
                value={format(new Date(), "PPP")}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/employee/dashboard")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <ul className="list-disc list-inside space-y-1">
            <li>All fields marked with * are required</li>
            <li>
              Your leave request will be sent to your manager for approval
            </li>
            <li>
              You will receive a notification once your request is reviewed
            </li>
            <li>
              Approved leave dates will be marked as "On Leave" in your
              attendance records
            </li>
            <li>You can cancel pending requests from your dashboard</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
