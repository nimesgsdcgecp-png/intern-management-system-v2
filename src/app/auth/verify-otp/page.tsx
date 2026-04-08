"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, CheckCircle2, Timer, Building } from "lucide-react";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    if (!email) {
      router.push('/auth/forgot-password');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (data.success && data.resetToken) {
        router.push(`/auth/reset-password?token=${data.resetToken}`);
      } else {
        setError(data.error || 'Invalid code.');
      }
    } catch {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setTimeLeft(600);
        setOtp("");
      } else {
        setError(data.error || 'Failed to resend.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

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
              Verify OTP
            </h1>
            <p className="text-sm text-content-secondary text-center">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="label text-center">6-Digit Confirmation Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="input text-center text-2xl font-bold tracking-widest h-16"
                required
              />
              {error && (
                <span className="form-error text-center">{error}</span>
              )}
              
              <div className="flex items-center justify-center gap-2 mt-3">
                <Timer className={`w-4 h-4 ${timeLeft < 60 ? "text-error animate-pulse" : "text-warning"}`} />
                <span className="text-sm text-content-secondary">
                  {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : "Code expired"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || otp.length !== 6 || timeLeft === 0}
                className="w-full"
                icon={<CheckCircle2 className="w-4 h-4" />}
                iconPosition="right"
                loading={loading}
              >
                {loading ? "Verifying..." : "Verify Code"}
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

          {/* Resend Section */}
          <div className="mt-8 pt-6 border-t border-border-subtle text-center">
            <p className="text-sm text-content-secondary mb-3">Didn&apos;t receive the code?</p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="text-sm font-medium text-primary-text hover:underline disabled:opacity-50"
            >
              {loading ? "Resending..." : "Resend Code"}
            </button>
          </div>
        </Card>

        <p className="text-center text-xs text-content-muted mt-8">
          © {new Date().getFullYear()} Intern Management System
        </p>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-app">
        <div className="spinner spinner-lg"></div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}