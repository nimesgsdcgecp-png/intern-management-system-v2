"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addSuccess, addError } from "@/lib/redux/slices/notificationSlice";
import { Mail, ArrowLeft, Send, Building } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        dispatch(addSuccess({
          title: "Code Sent",
          message: "Check your email."
        }));
        setTimeout(() => {
          router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
        }, 1200);
      } else {
        dispatch(addSuccess({
          title: "Request Sent",
          message: "Check your email if account exists."
        }));
        setTimeout(() => {
          router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
        }, 1200);
      }
    } catch {
      dispatch(addError({
        title: "Error",
        message: "Failed to send reset code."
      }));
    } finally {
      setLoading(false);
    }
  };

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
              Reset Password
            </h1>
            <p className="text-sm text-content-secondary text-center">
              Enter your email to receive a reset code
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="label" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input has-icon-left"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !email}
                className="w-full"
                icon={<Send className="w-4 h-4" />}
                iconPosition="right"
                loading={loading}
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </Button>

              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="btn btn-ghost w-full gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </form>
        </Card>

        <p className="text-center text-xs text-content-muted mt-8">
          © {new Date().getFullYear()} Intern Management System
        </p>
      </div>
    </div>
  );
}