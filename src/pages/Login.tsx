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

export default function Login() {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("Login form submitted with:", { empId, password });

    try {
      console.log("Calling authAPI.login...");
      const response = await authAPI.login(empId, password);
      console.log("API response received:", response);

      if (response.success && response.data) {
        console.log("Login successful, user data:", response.data.user);
        console.log("Calling auth store login...");
        login(response.data.user);
        console.log("Auth store updated, navigating to dashboard...");

        // Check user role and navigate accordingly
        if (response.data.user.role === "employee") {
          console.log("User is employee, navigating to /employee/dashboard");
          navigate("/employee/dashboard");
        } else if (response.data.user.role === "manager") {
          console.log("User is manager, navigating to /manager");
          navigate("/manager");
        } else if (response.data.user.role === "director") {
          console.log("User is director, navigating to /admin");
          navigate("/admin");
        } else {
          console.log(
            "User role not recognized, navigating to default dashboard"
          );
          navigate("/dashboard");
        }
      } else {
        console.log("Login failed with message:", response.message);
        setError(response.message || "Login failed");
      }
    } catch (err: unknown) {
      console.error("Login error caught:", err);
      const error = err as ApiError;
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      console.log("Setting error message:", errorMessage);
      setError(errorMessage);
    } finally {
      console.log("Login process completed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
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
              <Alert variant="destructive">
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
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
