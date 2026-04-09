"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addSuccess, addError } from "@/lib/redux/slices/notificationSlice";
import { ArrowRight, Building, Mail } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const router = useRouter();
  const dispatch = useAppDispatch();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!identifier) {
      newErrors.identifier = "Required";
    } else if (identifier.includes("@") && !/\S+@\S+\.\S+/.test(identifier)) {
      newErrors.identifier = "Invalid email";
    }

    if (!password) {
      newErrors.password = "Required";
    } else if (password.length < 6) {
      newErrors.password = "Min 6 chars";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        dispatch(addError({
          title: "Login Failed",
          message: "Invalid credentials."
        }));
        setErrors({ identifier: " ", password: "Invalid credentials" });
      } else {
        dispatch(addSuccess({
          title: "Success",
          message: "Welcome back."
        }));
        
        // Get the callback URL from query params (set by middleware)
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = params.get('callbackUrl');
        
        if (callbackUrl) {
          // Redirect to the originally requested page
          router.push(callbackUrl);
        } else {
          // Fetch session to get user role and redirect to appropriate dashboard
          const response = await fetch('/api/auth/session');
          const session = await response.json();
          const userRole = session?.user?.role;
          
          // Redirect based on role
          switch (userRole) {
            case 'admin':
              router.push('/dashboard/admin');
              break;
            case 'mentor':
              router.push('/dashboard/mentor');
              break;
            case 'intern':
              router.push('/dashboard/intern');
              break;
            default:
              router.push('/dashboard/admin'); // fallback
          }
        }
      }
    } catch {
      dispatch(addError({
        title: "Error",
        message: "An unexpected error occurred."
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-app p-4 relative">
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <Card className="p-8">
          {/* Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
              <Building className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-content-primary text-center mb-1">
              Sign In
            </h1>
            <p className="text-sm text-content-secondary text-center">
              Intern Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="label" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                <input
                  id="email"
                  type="text"
                  placeholder="you@example.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errors.identifier) setErrors(prev => ({ ...prev, identifier: undefined }));
                  }}
                  className={`input has-icon-left ${errors.identifier ? 'border-error' : ''}`}
                  aria-invalid={!!errors.identifier}
                  required
                />
              </div>
              {errors.identifier && errors.identifier !== " " && (
                <span className="form-error">{errors.identifier}</span>
              )}
            </div>

            <div className="form-group">
              <label className="label" htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                showPasswordToggle
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                required
                error={errors.password}
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => router.push('/auth/forgot-password')}
                className="text-sm text-primary-text hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              loading={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-subtle">
            <div className="p-4 bg-info-subtle rounded-lg text-center">
              <p className="text-xs font-semibold text-info-text mb-1">Demo Credentials</p>
              <p className="text-sm text-content-secondary">admin@internship.com / admin123</p>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-content-muted mt-8">
          © {new Date().getFullYear()} Intern Management System
        </p>
      </div>
    </div>
  );
}
