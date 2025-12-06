import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { managerAPI } from "@/services/api";
import type { User } from "@/types";

interface DeleteEmployeeModalProps {
  employee: User | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (deletedEmployeeId: string) => void;
}

export function DeleteEmployeeModal({ employee, isOpen, onClose, onDelete }: DeleteEmployeeModalProps) {
  const handleDelete = async () => {
    if (!employee) return;

    try {
      const response = await managerAPI.deleteEmployee(employee._id);
      if (response.success) {
        onDelete(employee._id);
        toast.success("Employee deactivated", {
          description: "Employee has been deactivated successfully.",
        });
        onClose();
      }
    } catch (error) {
      console.error("Failed to deactivate employee:", error);
      toast.error("Failed to deactivate employee", {
        description: "Could not deactivate employee. Please try again.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Employee 🗑️</DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate this employee? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {employee && (
          <div className="py-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium">Employee:</span>
              <span>{employee.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Employee ID:</span>
              <span>{employee.empId}</span>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Delete Employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}