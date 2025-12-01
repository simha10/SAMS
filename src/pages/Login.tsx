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
import { Loader2, Lock } from "lucide-react";
import { authAPI } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/types";
import { toast } from "@/components/ui/sonner";

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

    try {
      const response = await authAPI.login(empId, password);

      if (response.success && response.data) {
        login(response.data.user);
        toast.success("Login successful", {
          description: "Welcome back! You have been successfully logged in.",
        });

        // Check user role and navigate accordingly
        if (response.data.user.role === "employee") {
          navigate("/employee/dashboard");
        } else if (response.data.user.role === "manager") {
          navigate("/manager");
        } else if (response.data.user.role === "director") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(response.message || "Login failed");
        toast.error("Login failed", {
          description:
            response.message || "Please check your credentials and try again.",
        });
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);
      toast.error("Login failed", {
        description:
          error.response?.data?.message ||
          "Please check your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-blue-orange p-4">
      <Card className="w-full max-w-md card-modern shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
            <Lock className="h-8 w-8 text-primary mx-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">
            LRMC Staff Login
          </CardTitle>
          <CardDescription>
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
                className="input-modern h-12"
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
                className="input-modern h-12"
              />
            </div>

            <Button
              type="submit"
              className="w-full btn-primary h-12 text-base"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} LRMC Staff Attendance System</p>
            <p className="mt-1">All rights reserved</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}