import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { authAPI } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/types";
import { toast } from "@/components/ui/sonner";

export default function Login() {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("[Login] Form submitted:", empId);

    try {
      console.log("[Login] Calling authAPI.login...");
      const response = await authAPI.login(empId, password, rememberMe);
      console.log("[Login] API response received:", response);

      if (response.success && response.data) {
        const { user, accessToken, refreshToken, unusual, unusualActions } = response.data;
        
        console.log("[Login] Login successful, user:", user.empId);
        
        // Store tokens and user in auth store
        login(user, accessToken, refreshToken, unusual, unusualActions);
        
        // Show unusual login warning if detected
        if (unusual) {
          toast.warning("Unusual Login Detected", {
            description: `Warning: ${unusualActions?.join(', ') || 'Unusual login activity detected'}`,
            duration: 5000,
          });
        }
        
        toast.success("Login successful", {
          description: "Welcome back! You have been successfully logged in.",
        });

        // Navigate based on user role
        if (user.role === "employee") {
          console.log("[Login] Navigating to employee dashboard");
          navigate("/employee/dashboard");
        } else if (user.role === "manager") {
          console.log("[Login] Navigating to manager dashboard");
          navigate("/manager");
        } else if (user.role === "director") {
          console.log("[Login] Navigating to admin dashboard");
          navigate("/admin");
        } else {
          console.log("[Login] Navigating to default dashboard");
          navigate("/dashboard");
        }
      } else {
        console.log("[Login] Login failed:", response.message);
        setError(response.message || "Login failed");
        toast.error("Login failed", {
          description: response.message || "Please check your credentials and try again.",
        });
      }
    } catch (err: unknown) {
      console.error("[Login] Error:", err);
      const error = err as ApiError;
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);
      toast.error("Login failed", {
        description: error.response?.data?.message || "Please check your credentials and try again.",
      });
    } finally {
      console.log("[Login] Process completed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-blue-orange p-4">
      <Card className="w-full max-w-md card-modern">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            LRMC Staff Attendance System
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="alert-modern">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="empId">Employee ID</Label>
              <Input
                id="empId"
                type="text"
                placeholder="Enter your employee ID"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                required
                disabled={loading}
                className="input-modern"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="input-modern"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="rememberMe">Remember me</Label>
            </div>

            <Button
              type="submit"
              className="w-full btn-primary"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
