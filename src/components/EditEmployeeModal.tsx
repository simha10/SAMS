import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { managerAPI } from "@/services/api";
import type { User, Branch } from "@/types";

interface EditEmployeeModalProps {
  employee: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedEmployee: User) => void;
  branches: Branch[];
}

export function EditEmployeeModal({ employee, isOpen, onClose, onUpdate, branches }: EditEmployeeModalProps) {
  const [name, setName] = useState("");
  const [empId, setEmpId] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [branchId, setBranchId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmpId(employee.empId);
      setEmail(employee.email);
      setDob(employee.dob || "");
      // For branch, we would need to map the user's officeLocation to a branch
      // This is a simplified implementation
      setIsActive(employee.isActive);
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setLoading(true);
    try {
      // Prepare update data
      const updateData: Partial<User> = {
        name,
        email,
        dob: dob || undefined,
        isActive
      };

      // If branch is selected, update officeLocation
      if (branchId) {
        const selectedBranch = branches.find(b => b._id === branchId);
        if (selectedBranch) {
          updateData.officeLocation = {
            lat: selectedBranch.location.lat,
            lng: selectedBranch.location.lng,
            radius: selectedBranch.radius || 50
          };
        }
      }

      const response = await managerAPI.updateEmployee(employee._id, updateData);
      if (response.success && response.data?.employee) {
        onUpdate(response.data.employee);
        toast.success("Employee updated", {
          description: "Employee details have been updated successfully.",
        });
        onClose();
      }
    } catch (error) {
      console.error("Failed to update employee:", error);
      toast.error("Failed to update employee", {
        description: "Could not update employee details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update employee details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="empId" className="text-right">
                Employee ID
              </Label>
              <div className="col-span-3">
                <Input
                  id="empId"
                  value={empId}
                  readOnly
                  className="w-full bg-gray-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <div className="col-span-3">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dob" className="text-right">
                Date of Birth
              </Label>
              <div className="col-span-3">
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="branch" className="text-right">
                Branch
              </Label>
              <div className="col-span-3">
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}