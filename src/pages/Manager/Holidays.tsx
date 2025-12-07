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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, Edit, RefreshCw } from "lucide-react";
import { managerAPI } from "@/services/api";
import { format } from "date-fns";
import { toast } from "@/components/ui/sonner";

interface Holiday {
  _id: string;
  date: string;
  name: string;
  description?: string;
  createdBy: {
    empId: string;
    name: string;
  };
  createdAt: string;
}

export default function ManagerHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentHolidayId, setCurrentHolidayId] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [holidayDescription, setHolidayDescription] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);

  // Remove auto-fetch useEffect and replace with manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const response = await managerAPI.getHolidays(
        selectedYear,
        selectedMonth
      );
      if (response.success && response.data) {
        setHolidays(response.data.holidays);
      }
    } catch (err: any) {
      console.error("Failed to fetch holidays:", err);
      setError(err.response?.data?.message || "Failed to fetch holidays");
      toast.error("Failed to load holidays", {
        description: "Could not load holidays. Please try again.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      if (isEditing && currentHolidayId) {
        // Update existing holiday
        await managerAPI.updateHoliday(
          currentHolidayId,
          holidayDate,
          holidayName,
          holidayDescription
        );
        toast.success("Holiday updated", {
          description: "Holiday has been updated successfully.",
        });
      } else {
        // Create new holiday
        await managerAPI.createHoliday(
          holidayDate,
          holidayName,
          holidayDescription
        );
        toast.success("Holiday created", {
          description: "Holiday has been created successfully.",
        });
      }

      // Close dialog and reset form
      setIsDialogOpen(false);
      resetForm();

      // Refresh holidays list
      handleRefresh();
    } catch (err: any) {
      console.error("Failed to save holiday:", err);
      setError(err.response?.data?.message || "Failed to save holiday");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setIsEditing(true);
    setCurrentHolidayId(holiday._id);
    setHolidayDate(format(new Date(holiday.date), "yyyy-MM-dd"));
    setHolidayName(holiday.name);
    setHolidayDescription(holiday.description || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!holidayToDelete) return;

    try {
      await managerAPI.deleteHoliday(holidayToDelete._id);
      toast.success("Holiday deleted", {
        description: "Holiday has been deleted successfully.",
      });

      // Close dialog and refresh holidays list
      setIsDeleteDialogOpen(false);
      setHolidayToDelete(null);
      handleRefresh();
    } catch (err: any) {
      console.error("Failed to delete holiday:", err);
      setError(err.response?.data?.message || "Failed to delete holiday");
      toast.error("Failed to delete holiday", {
        description: "Could not delete holiday. Please try again.",
      });
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentHolidayId("");
    setHolidayDate("");
    setHolidayName("");
    setHolidayDescription("");
  };

  const openDeleteDialog = (holiday: Holiday) => {
    setHolidayToDelete(holiday);
    setIsDeleteDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Holiday Management</h1>
        <p className="text-muted-foreground">
          Manage holidays for your organization
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Holiday Filters</CardTitle>
          <CardDescription>Filter holidays by year and month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                min="2020"
                max="2030"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <select
                id="month"
                className="w-full p-2 border rounded-md bg-background text-foreground border-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Holiday Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Holiday" : "Add New Holiday"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Edit the holiday details below."
                  : "Enter the details for the new holiday."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., New Year's Day"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={holidayDescription}
                    onChange={(e) => setHolidayDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  closeDialog();
                  handleRefresh();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading || refreshing}>
                  {formLoading || refreshing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {isEditing ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Holidays Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
          <div>
            <CardTitle className="text-2xl font-bold px-4 py-2">Holidays</CardTitle>
            <CardDescription className="text-sm text-gray-500 px-4">
              List of holidays for the selected period
            </CardDescription>
          </div>
          <div className="px-4">
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="w-full sm:w-auto">
              {refreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>
        <CardContent>
          {refreshing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading holidays...</span>
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No holidays found for the selected period.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Add a new holiday using the button above.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Description</TableHead>
                    <TableHead className="whitespace-nowrap">Created By</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => (
                    <TableRow key={holiday._id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(holiday.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{holiday.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{holiday.description || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {holiday.createdBy.name} ({holiday.createdBy.empId})
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(holiday)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(holiday)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              holiday "{holidayToDelete?.name}" on{" "}
              {holidayToDelete &&
                format(new Date(holidayToDelete.date), "MMM d, yyyy")}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
