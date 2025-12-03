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
import { Loader2, MapPin, Trash2, Edit } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { branchAPI } from "@/services/api";
import type { Branch } from "@/types";

export default function BranchManagement() {
  const { user } = useAuthStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    lat: "",
    lng: "",
    radius: "50",
    isActive: true
  });

  // Check if user is manager or director
  const isAuthorized = user?.role === "manager" || user?.role === "director";

  // Remove auto-fetch useEffect and replace with manual refresh
  const handleRefresh = async () => {
    if (!isAuthorized) return;
    
    setRefreshing(true);
    setError("");
    
    try {
      const response = await branchAPI.getBranches();
      if (response.success) {
        setBranches(response.data.branches);
      } else {
        setError(response.message || "Failed to fetch branches");
      }
    } catch (err) {
      setError("Failed to fetch branches. Please try again.");
      console.error("Failed to fetch branches:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load when component mounts
  useState(() => {
    handleRefresh();
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    // Validate form
    if (!formData.name || !formData.lat || !formData.lng) {
      setError("Name, latitude, and longitude are required");
      setLoading(false);
      return;
    }
    
    try {
      const branchData = {
        name: formData.name,
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng)
        },
        radius: parseInt(formData.radius) || 50,
        isActive: formData.isActive
      };
      
      let response;
      if (isEditing && editingId) {
        response = await branchAPI.updateBranch(editingId, branchData);
      } else {
        response = await branchAPI.createBranch(branchData);
      }
      
      if (response.success) {
        setSuccess(isEditing ? "Branch updated successfully!" : "Branch created successfully!");
        // Reset form
        setFormData({
          name: "",
          lat: "",
          lng: "",
          radius: "50",
          isActive: true
        });
        setIsEditing(false);
        setEditingId(null);
        handleRefresh(); // Refresh the list
      } else {
        setError(response.message || (isEditing ? "Failed to update branch" : "Failed to create branch"));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || (isEditing ? "Failed to update branch. Please try again." : "Failed to create branch. Please try again.");
      setError(errorMessage);
      console.error("Failed to save branch:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setFormData({
      name: branch.name,
      lat: branch.location.lat.toString(),
      lng: branch.location.lng.toString(),
      radius: branch.radius?.toString() || "50",
      isActive: branch.isActive
    });
    setIsEditing(true);
    setEditingId(branch._id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await branchAPI.deleteBranch(id);
      if (response.success) {
        setSuccess("Branch deleted successfully!");
        handleRefresh(); // Refresh the list
      } else {
        setError(response.message || "Failed to delete branch");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to delete branch. Please try again.";
      setError(errorMessage);
      console.error("Failed to delete branch:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      lat: "",
      lng: "",
      radius: "50",
      isActive: true
    });
    setIsEditing(false);
    setEditingId(null);
  };

  if (!isAuthorized) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Branch Management</h1>
          <p className="text-muted-foreground">
            You don't have permission to manage branches.
          </p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Only managers and directors can manage branches. Please contact your system administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Branch Management</h1>
        <p className="text-muted-foreground">
          Manage office branches for attendance tracking
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Branch" : "Add New Branch"}</CardTitle>
            <CardDescription>
              {isEditing 
                ? "Update the branch details below" 
                : "Enter branch details to create a new office location"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Branch Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter branch name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude *</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={handleChange}
                    placeholder="Enter latitude"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lng">Longitude *</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={handleChange}
                    placeholder="Enter longitude"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={formData.radius}
                  onChange={handleChange}
                  placeholder="Enter radius in meters"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isActive">Active Branch</Label>
              </div>

              <div className="flex space-x-3">
                <Button type="submit" disabled={loading || refreshing} className="flex-1">
                  {loading || refreshing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {isEditing ? "Update Branch" : "Add Branch"}
                </Button>
                
                {isEditing && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      handleCancel();
                      handleRefresh();
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <div>
              <CardTitle className="text-2xl font-bold px-6 pt-4">Existing Branches</CardTitle>
              <CardDescription className="px-6">
                Manage all office locations for attendance tracking
              </CardDescription>
            </div>
          </div>
          <CardContent>
            {loading || refreshing && branches.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : branches.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No branches found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get started by adding a new branch.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {branches.map((branch) => (
                  <div 
                    key={branch._id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <h4 className="font-medium">{branch.name}</h4>
                        {!branch.isActive && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Lat: {branch.location.lat.toFixed(6)}, 
                        Lng: {branch.location.lng.toFixed(6)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Radius: {branch.radius || 50} meters
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(branch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(branch)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(branch._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Employees can mark their attendance from any active branch
            </li>
            <li>
              Latitude and longitude values must be in decimal degrees format
            </li>
            <li>
              Radius defines the geofence area around the branch location (default 50 meters)
            </li>
            <li>
              Only active branches are available for attendance marking
            </li>
            <li>
              Managers and directors can create, update, or delete branches
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}