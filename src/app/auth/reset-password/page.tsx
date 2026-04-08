"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Eye, EyeOff, ArrowRight, ShieldCheck, Lock, ShieldAlert, Building } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/auth/forgot-password');
    }
  }, [token, router]);

  const validatePassword = (pwd: string) => {
    const requirements = [
      { id: 1, label: "8+ chars", valid: pwd.length >= 8 },
      { id: 2, label: "Lowercase", valid: /(?=.*[a-z])/.test(pwd) },
      { id: 3, label: "Uppercase", valid: /(?=.*[A-Z])/.test(pwd) },
      { id: 4, label: "Number", valid: /(?=.*\d)/.test(pwd) },
    ];
    return requirements;
  };

  const requirements = validatePassword(password);
  const isPasswordValid = requirements.every(req => req.valid);
  const isConfirmPasswordValid = confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid || !isConfirmPasswordValid) {
      setError("Please check requirements.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-app p-6">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-success-subtle rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-content-primary mb-2">
              Password Updated
            </h1>
            <p className="text-sm text-content-secondary mb-8">
              Redirecting to login...
            </p>
            <div className="spinner spinner-lg mx-auto"></div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-app p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
              <Building className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-content-primary text-center mb-1">
              New Password
            </h1>
            <p className="text-sm text-content-secondary text-center">
              Create a secure password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="label" htmlFor="password">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Requirements */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {requirements.map(req => (
                  <div key={req.id} className="flex items-center gap-2 p-2 bg-surface-muted rounded-lg">
                    {req.valid ? (
                      <CheckCircle2 className="w-3 h-3 text-success" />
                    ) : (
                      <ShieldAlert className="w-3 h-3 text-content-muted" />
                    )}
                    <span className={`text-xs font-medium ${req.valid ? "text-content-primary" : "text-content-muted"}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input pl-10 ${confirmPassword && !isConfirmPasswordValid ? 'border-error' : ''}`}
                  required
                />
              </div>
              {confirmPassword && !isConfirmPasswordValid && (
                <span className="form-error">Passwords don&apos;t match</span>
              )}
            </div>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !isPasswordValid || !isConfirmPasswordValid}
              className="w-full"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              loading={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-content-muted mt-8">
          © {new Date().getFullYear()} Intern Management System
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-app">
        <div className="spinner spinner-lg"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
