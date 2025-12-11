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
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuthStore } from "@/stores/authStore";
import { leaveAPI } from "@/services/api";
import { format } from "date-fns";
import type { LeaveRequestData, ApiError } from "@/types";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";

export default function ApplyLeave() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LeaveRequestData>({
    startDate: "",
    endDate: "",
    reason: "",
    type: "personal",
  });

  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState<"morning" | "afternoon">(
    "morning"
  );
  const [isHalfDayStart, setIsHalfDayStart] = useState(false);
  const [halfDayTypeStart, setHalfDayTypeStart] = useState<
    "morning" | "afternoon"
  >("morning");
  const [isHalfDayEnd, setIsHalfDayEnd] = useState(false);
  const [halfDayTypeEnd, setHalfDayTypeEnd] = useState<"morning" | "afternoon">(
    "morning"
  );

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
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Adjust for half-day leaves
        if (isHalfDay) {
          diffDays = 0.5;
        } else {
          if (isHalfDayStart) diffDays -= 0.5;
          if (isHalfDayEnd) diffDays -= 0.5;
        }

        setTotalDays(diffDays);
      } else {
        setTotalDays(0);
      }
    } else {
      setTotalDays(0);
    }
  }, [
    formData.startDate,
    formData.endDate,
    isHalfDay,
    isHalfDayStart,
    isHalfDayEnd,
  ]);

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
      toast.error("Missing required fields", {
        description: "Please fill in all required fields.",
      });
      return;
    }

    if (formData.reason && formData.reason.length < 10) {
      setError("Reason must be at least 10 characters long if provided");
      toast.error("Reason too short", {
        description: "Reason must be at least 10 characters long if provided.",
      });
      return;
    }

    if (totalDays <= 0) {
      setError("End date must be after start date");
      toast.error("Invalid date range", {
        description: "End date must be after start date.",
      });
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const leaveData = {
        ...formData,
        isHalfDay,
        halfDayType: isHalfDay ? halfDayType : undefined,
        isHalfDayStart,
        halfDayTypeStart: isHalfDayStart ? halfDayTypeStart : undefined,
        isHalfDayEnd,
        halfDayTypeEnd: isHalfDayEnd ? halfDayTypeEnd : undefined,
      };

      const response = await leaveAPI.createLeaveRequest(leaveData);
      if (response.success) {
        setMessage("Leave request submitted successfully!");
        toast.success("Leave request submitted", {
          description: "Your leave request has been submitted successfully.",
        });
        // Reset form
        setFormData({
          startDate: "",
          endDate: "",
          reason: "",
          type: "personal",
        });
        setIsHalfDay(false);
        setHalfDayType("morning");
        setIsHalfDayStart(false);
        setHalfDayTypeStart("morning");
        setIsHalfDayEnd(false);
        setHalfDayTypeEnd("morning");
        setTotalDays(0);
        // Navigate to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/employee/dashboard");
        }, 2000);
      } else {
        setError(response.message || "Failed to submit leave request");
        toast.error("Failed to submit leave request", {
          description: response.message || "Please try again.",
        });
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(
        error.response?.data?.message || "Failed to submit leave request"
      );
      toast.error("Failed to submit leave request", {
        description: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

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

  return (
    <div className="max-w-full mx-auto space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Apply for Leave</h1>
        <p className="text-muted-foreground">Submit your leave application</p>
      </div>

      {message && (
        <Alert className="alert-modern">
          <AlertDescription className="text-green-500">
            {message}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="alert-modern">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Official Leave Application Form */}
      <Card className="border-2 border-border card-modern">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-xl font-bold text-foreground">
            LRMC Employee Leave Application
          </CardTitle>
          <CardDescription>
            Official leave request form for LRMC staff members
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                Employee Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={user?.name || ""}
                    disabled
                    className="bg-secondary input-modern"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empId">Employee ID</Label>
                  <Input
                    id="empId"
                    value={user?.empId || ""}
                    disabled
                    className="bg-secondary input-modern"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Leave Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                Leave Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Leave Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger className="input-modern">
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
                    className="input-modern"
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
                    className="input-modern"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalDays">Total Days</Label>
                  <Input
                    id="totalDays"
                    value={totalDays}
                    disabled
                    className="bg-secondary font-semibold input-modern"
                  />
                </div>
              </div>
            </div>

            {/* Half-Day Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                Half-Day Options
              </h3>

              {/* Full Half-Day */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="half-day"
                  checked={isHalfDay}
                  onCheckedChange={setIsHalfDay}
                />
                <Label htmlFor="half-day">Apply for Half-Day Leave</Label>
              </div>

              {isHalfDay && (
                <div className="ml-8 space-y-2">
                  <Label>Half-Day Type</Label>
                  <RadioGroup
                    value={halfDayType}
                    onValueChange={(value) =>
                      setHalfDayType(value as "morning" | "afternoon")
                    }
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="morning" id="morning" />
                      <Label htmlFor="morning">Morning</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="afternoon" id="afternoon" />
                      <Label htmlFor="afternoon">Afternoon</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Partial Half-Day Start */}
              {!isHalfDay && (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="half-day-start"
                      checked={isHalfDayStart}
                      onCheckedChange={setIsHalfDayStart}
                    />
                    <Label htmlFor="half-day-start">
                      Half-Day on Start Date
                    </Label>
                  </div>

                  {isHalfDayStart && (
                    <div className="ml-8 space-y-2">
                      <Label>Start Date Half-Day Type</Label>
                      <RadioGroup
                        value={halfDayTypeStart}
                        onValueChange={(value) =>
                          setHalfDayTypeStart(value as "morning" | "afternoon")
                        }
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="morning" id="morning-start" />
                          <Label htmlFor="morning-start">Morning</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="afternoon"
                            id="afternoon-start"
                          />
                          <Label htmlFor="afternoon-start">Afternoon</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Partial Half-Day End */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="half-day-end"
                      checked={isHalfDayEnd}
                      onCheckedChange={setIsHalfDayEnd}
                    />
                    <Label htmlFor="half-day-end">Half-Day on End Date</Label>
                  </div>

                  {isHalfDayEnd && (
                    <div className="ml-8 space-y-2">
                      <Label>End Date Half-Day Type</Label>
                      <RadioGroup
                        value={halfDayTypeEnd}
                        onValueChange={(value) =>
                          setHalfDayTypeEnd(value as "morning" | "afternoon")
                        }
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="morning" id="morning-end" />
                          <Label htmlFor="morning-end">Morning</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="afternoon"
                            id="afternoon-end"
                          />
                          <Label htmlFor="afternoon-end">Afternoon</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </>
              )}
            </div>

            <Separator />

            {/* Reason Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">
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
                  className="input-modern"
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
                className="bg-secondary input-modern"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/employee/dashboard")}
                disabled={loading}
                className="btn-secondary"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="text-lg">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
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
            <li>Half-day leaves count as 0.5 days toward your total leave</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
