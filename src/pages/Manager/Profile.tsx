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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/stores/authStore";
import { Loader2, User, BadgeCheck } from "lucide-react";
import type { User as FullUser } from "@/types";
import { authAPI } from "@/services/api";
// Import profile cache utilities
import { saveProfileToCache, loadProfileFromCache } from "@/utils/profileCache";

export default function ManagerProfile() {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const fullUser = user as FullUser | null;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load cached profile data immediately on component mount
  // Only fetch from API if no cache exists
  useEffect(() => {
    // First, try to load from cache
    const cachedProfile = loadProfileFromCache();
    if (cachedProfile) {
      console.log("Loaded profile data from cache");
      setName(cachedProfile.name || "");
      setEmail(cachedProfile.email || "");
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
            // Update form fields
            setName(response.data.user.name || "");
            setEmail(response.data.user.email || "");
          }
        } catch (error) {
          console.error("Failed to fetch profile data:", error);
        }
      };
      
      fetchProfileData();
    }
  }, []); // Empty dependency array - only run on mount

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authAPI.updateProfile({ name, email });
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setSuccess("Profile updated successfully!");
        // Save updated profile to cache
        saveProfileToCache(response.data.user);
      } else {
        setError("Failed to update profile");
      }
    } catch (err: unknown) {
      setError("Failed to update profile");
      console.error("Failed to update profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await authAPI.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        setPasswordSuccess("Password changed successfully!");
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(response.message || "Failed to change password");
      }
    } catch (err: unknown) {
      setPasswordError("Failed to change password");
      console.error("Failed to change password:", err);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout(); // Clear local state
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API call fails, still clear local state
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your profile information</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee-id">Employee ID</Label>
                  <Input
                    id="employee-id"
                    value={fullUser?.empId || ""}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={
                      fullUser?.role === "director" ? "Director" : "Manager"
                    }
                    disabled
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button onClick={handleUpdateProfile} disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Update Profile
                </Button>
                <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Section */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              {passwordSuccess && (
                <Alert>
                  <AlertDescription className="text-green-600">
                    {passwordSuccess}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={passwordLoading}
                    className="w-full sm:w-auto"
                  >
                    {passwordLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Change Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Office Location Map */}
          <Card>
            <CardHeader>
              <CardTitle>Office Location Map</CardTitle>
              <CardDescription>
                View your office location on Google Maps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video w-full rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps?q=26.913717644555838,80.9533986643402&z=17&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Office Location"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Coordinates: 26.913717644555838, 80.9533986643402</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold">{fullUser?.name}</h3>
                  <p className="text-muted-foreground">{fullUser?.email}</p>
                  <div className="flex items-center justify-center mt-2">
                    <BadgeCheck className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm">
                      {fullUser?.role === "director" ? "Director" : "Manager"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee ID</span>
                  <span className="font-medium">{fullUser?.empId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">
                    {fullUser?.createdAt
                      ? new Date(fullUser.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}