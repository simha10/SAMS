import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { authAPI } from "@/services/api";
import type { ApiResponse } from "@/types";
// Added Dialog components for confirmation
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
// Import profile cache utilities
import { saveProfileToCache, loadProfileFromCache } from "@/utils/profileCache";

// Helper function to format date for input field
const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    // Create a Date object from the dateString
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) return "";
    // Format as YYYY-MM-DD for input[type="date"]
    return date.toISOString().split('T')[0];
  } catch {
    return "";
  }
};

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  // Access DOB and format it for the date input
  const [dob, setDob] = useState<string>(() => {
    if (user?.dob) {
      // Format the DOB from the user object for the date input
      return formatDateForInput(user.dob);
    }
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // Confirmation dialog states
  const [showProfileConfirm, setShowProfileConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const navigate = useNavigate();
  const { logout } = useAuthStore();

  // Load cached profile data immediately on component mount
  // Only fetch from API if no cache exists
  useEffect(() => {
    // First, try to load from cache
    const cachedProfile = loadProfileFromCache();
    if (cachedProfile) {
      console.log("Loaded profile data from cache");
      setName(cachedProfile.name || "");
      setEmail(cachedProfile.email || "");
      setDob(formatDateForInput(cachedProfile.dob));
      // Update the user in the store with cached data
      if (cachedProfile._id) {
        setUser(cachedProfile);
      }
    } else {
      // Only fetch from API if no cache exists
      const fetchProfileData = async () => {
        try {
          const response = await authAPI.getProfile();
          if (response.success && response.data?.user) {
            // Update the user in the store
            setUser(response.data.user);
            // Save to cache
            saveProfileToCache(response.data.user);
          }
        } catch (error) {
          console.error("Failed to fetch profile data:", error);
        }
      };
      
      fetchProfileData();
    }
  }, []); // Empty dependency array - only run on mount
  
  // Update form state when user data changes (from API response)
  // But only if it's not already set from cache
  useEffect(() => {
    if (user && !name && !email && !dob) {
      setName(user.name || "");
      setEmail(user.email || "");
      setDob(formatDateForInput(user.dob));
    }
  }, [user, name, email, dob]);

  // Handle profile update submission with confirmation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowProfileConfirm(true);
  };

  // Actual profile update function
  const performProfileUpdate = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    setShowProfileConfirm(false);

    try {
      const response = await authAPI.updateProfile({ name, email, dob });
      if (response.success) {
        setMessage(response.message || "Profile updated successfully");
        // Update the user in the store
        if (response.data?.user) {
          setUser(response.data.user);
          // Also update the DOB state with the formatted value
          setDob(formatDateForInput(response.data.user.dob));
          // Save updated profile to cache
          saveProfileToCache(response.data.user);
        }
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle password change submission with confirmation
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPasswordConfirm(true);
  };

  // Actual password change function
  const performPasswordChange = async () => {
    setPasswordLoading(true);
    setPasswordMessage("");
    setPasswordError("");
    setShowPasswordConfirm(false);

    try {
      const response: ApiResponse = await authAPI.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        setPasswordMessage(response.message || "Password changed successfully");
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(response.message || "Failed to change password");
      }
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message || "Failed to change password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle logout with confirmation
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  // Actual logout function
  const performLogout = async () => {
    try {
      await authAPI.logout();
      logout(); // Clear local state
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API call fails, still clear local state
      logout();
      navigate("/login");
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-white">Manage your profile information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription className="text-white">Update your personal details here</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empId" className="text-white">Employee ID</Label>
                <Input id="empId" value={user?.empId || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob" className="text-white">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dob || ""}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-white">Role</Label>
                <Input id="role" value={user?.role || ""} disabled />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
              <Button type="button" variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription className="text-white">
            Update your password regularly to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordMessage && (
              <Alert>
                <AlertDescription className="text-green-600">
                  {passwordMessage}
                </AlertDescription>
              </Alert>
            )}

            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Profile Update Confirmation Dialog */}
      <Dialog open={showProfileConfirm} onOpenChange={setShowProfileConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Profile Update</DialogTitle>
            <DialogDescription className="text-white">
              Are you sure you want to update your profile information?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={performProfileUpdate}>Confirm Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Confirmation Dialog */}
      <Dialog open={showPasswordConfirm} onOpenChange={setShowPasswordConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Password Change</DialogTitle>
            <DialogDescription className="text-white">
              Are you sure you want to change your password?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={performPasswordChange}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Logout</DialogTitle>
            <DialogDescription className="text-white">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={performLogout}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}