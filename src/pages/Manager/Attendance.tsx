import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pencil,
  Trash2,
} from "lucide-react";
import { managerAPI } from "@/services/api";
import { format } from "date-fns";
import { toast } from "@/components/ui/sonner";
import { EditEmployeeModal } from "@/components/EditEmployeeModal";
import { DeleteEmployeeModal } from "@/components/DeleteEmployeeModal";
import type { User, Branch } from "@/types";

interface TeamMember {
  employee: {
    id: string;
    empId: string;
    name: string;
    email: string;
  };
  attendance: {
    status: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    workingHours: number | null;
    flagged: boolean;
  };
}

interface TeamAttendanceData {
  date: string;
  team: TeamMember[];
  summary: {
    total: number;
    present: number;
    absent: number;
    flagged: number;
  };
}

export default function ManagerAttendance() {
  // Default to today's date
  const defaultDate = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [teamAttendance, setTeamAttendance] =
    useState<TeamAttendanceData | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "present" | "absent" | "flagged"
  >("all");
  
  // Employee management states
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Remove auto-fetch useEffect and replace with manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      console.log("Fetching attendance for date:", selectedDate);
      console.log(
        "Making API call to:",
        `/manager/team/attendance?date=${selectedDate}`
      );

      const response = await managerAPI.getTeamAttendance(selectedDate);
      console.log("API Response received:", response);
      if (response.success && response.data) {
        console.log("Team data:", response.data.team);
        setTeamAttendance(response.data);
        toast.success("Attendance data loaded", {
          description: `Attendance data for ${format(
            new Date(selectedDate),
            "MMM d, yyyy"
          )} loaded successfully.`,
        });
      } else {
        setError("No data received from server");
        toast.error("No data received", {
          description: "Could not load attendance data.",
        });
      }
    } catch (err: unknown) {
      console.error("Failed to fetch team attendance:", err);
      console.error("Error details:", (err as any).response?.data || err);
      console.error("Error status:", (err as any).response?.status);
      console.error("Error headers:", (err as any).response?.headers);
      setError(
        "Failed to fetch team attendance: " +
          ((err as any).response?.data?.message || (err as Error).message)
      );
      toast.error("Failed to load attendance", {
        description: "Could not load attendance data. Please try again.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string, flagged: boolean) => {
    // Show flagged status with yellow color
    if (flagged) {
      return (
        <Badge variant="default" className="bg-yellow-500">
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
      case "half-day":
        return (
          <Badge variant="default" className="bg-yellow-500">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Half Day
          </Badge>
        );
      case "on-leave":
        return (
          <Badge variant="secondary" className="bg-blue-500 text-white">
            On Leave
          </Badge>
        );
      case "outside-duty":
        return (
          <Badge variant="default" className="bg-yellow-500">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Outside Duty
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleEditEmployee = (employeeId: string) => {
    // Find the employee in the team data
    const teamMember = teamAttendance?.team.find(
      member => member.employee.id === employeeId
    );
    
    if (teamMember) {
      // Create a User object from the team member data
      const user: User = {
        _id: teamMember.employee.id,
        empId: teamMember.employee.empId,
        name: teamMember.employee.name,
        email: teamMember.employee.email,
        role: "employee",
        isActive: true,
        officeLocation: {
          lat: 0,
          lng: 0,
          radius: 50
        },
        createdAt: "",
        updatedAt: ""
      };
      
      setEditingEmployee(user);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteEmployee = (employeeId: string) => {
    // Find the employee in the team data
    const teamMember = teamAttendance?.team.find(
      member => member.employee.id === employeeId
    );
    
    if (teamMember) {
      // Create a User object from the team member data
      const user: User = {
        _id: teamMember.employee.id,
        empId: teamMember.employee.empId,
        name: teamMember.employee.name,
        email: teamMember.employee.email,
        role: "employee",
        isActive: true,
        officeLocation: {
          lat: 0,
          lng: 0,
          radius: 50
        },
        createdAt: "",
        updatedAt: ""
      };
      
      setDeletingEmployee(user);
      setIsDeleteModalOpen(true);
    }
  };

  const handleEmployeeUpdated = (updatedEmployee: User) => {
    // Optimistically update the team attendance data
    if (teamAttendance) {
      const updatedTeam = teamAttendance.team.map(member => {
        if (member.employee.id === updatedEmployee._id) {
          return {
            ...member,
            employee: {
              ...member.employee,
              name: updatedEmployee.name,
              email: updatedEmployee.email
            }
          };
        }
        return member;
      });
      
      setTeamAttendance({
        ...teamAttendance,
        team: updatedTeam
      });
    }
  };

  const handleEmployeeDeleted = (deletedEmployeeId: string) => {
    // Optimistically remove the employee from the team attendance data
    if (teamAttendance) {
      const updatedTeam = teamAttendance.team.filter(
        member => member.employee.id !== deletedEmployeeId
      );
      
      setTeamAttendance({
        ...teamAttendance,
        team: updatedTeam,
        summary: {
          ...teamAttendance.summary,
          total: teamAttendance.summary.total - 1
        }
      });
    }
  };

  const filteredTeam =
    teamAttendance?.team.filter((member) => {
      if (filter === "all") return true;
      if (filter === "present") return member.attendance.status === "present";
      if (filter === "absent") return member.attendance.status === "absent";
      if (filter === "flagged") return member.attendance.flagged;
      return true;
    }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Attendance</h1>
        <p className="text-muted-foreground">
          View and manage your team's attendance records
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Filters</CardTitle>
          <CardDescription>
            Select date and filter options to view attendance records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter">Status Filter</Label>
              <Select
                value={filter}
                onValueChange={(
                  value: "all" | "present" | "absent" | "flagged"
                ) => setFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="present">Present Only</SelectItem>
                  <SelectItem value="absent">Absent Only</SelectItem>
                  <SelectItem value="flagged">Flagged Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleRefresh} disabled={refreshing} className="w-full md:w-auto">
                {refreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {teamAttendance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Team</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamAttendance.summary.total}
              </div>
              <div className="text-xs text-muted-foreground">Team members</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {teamAttendance.summary.present}
              </div>
              <div className="text-xs text-muted-foreground">Checked in</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {teamAttendance.summary.absent}
              </div>
              <div className="text-xs text-muted-foreground">
                Not checked in
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {teamAttendance.summary.flagged}
              </div>
              <div className="text-xs text-muted-foreground">
                Issues detected
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Team Attendance - {format(new Date(selectedDate), "MMM d, yyyy")}
          </CardTitle>
          <CardDescription>
            Detailed attendance records for your team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {refreshing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading attendance data...</span>
            </div>
          ) : filteredTeam.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No attendance records found for the selected date and filters.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Try to refresh the data.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Employee</TableHead>
                    <TableHead className="whitespace-nowrap">Employee ID</TableHead>
                    <TableHead className="whitespace-nowrap">Check-in</TableHead>
                    <TableHead className="whitespace-nowrap">Check-out</TableHead>
                    <TableHead className="whitespace-nowrap">Working Hours</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeam.map((member) => (
                    <TableRow key={member.employee.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {member.employee.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{member.employee.empId}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {member.attendance.checkInTime
                          ? format(
                              new Date(member.attendance.checkInTime),
                              "HH:mm"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {member.attendance.checkOutTime
                          ? format(
                              new Date(member.attendance.checkOutTime),
                              "HH:mm"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {member.attendance.workingHours !== null
                          ? `${Math.floor(
                              member.attendance.workingHours / 60
                            )}h ${member.attendance.workingHours % 60}m`
                          : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getStatusBadge(
                          member.attendance.status,
                          member.attendance.flagged
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEmployee(member.employee.id)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEmployee(member.employee.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        employee={editingEmployee}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEmployee(null);
        }}
        onUpdate={handleEmployeeUpdated}
        branches={branches}
      />

      {/* Delete Employee Modal */}
      <DeleteEmployeeModal
        employee={deletingEmployee}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingEmployee(null);
        }}
        onDelete={handleEmployeeDeleted}
      />
    </div>
  );
}