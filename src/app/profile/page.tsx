import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addSuccess, addError } from "@/lib/redux/slices/notificationSlice";
import { User, Mail, ShieldCheck, Key, Building2, Save, Loader2, Activity } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Email update state
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  /**
   * Logic: Get Profile
   * Gets user details from the server.
   */
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();

      if (res.ok) {
        setProfile(data.user);
        setEmail(data.user.email);
      } else {
        dispatch(addError({
          title: "Profile Error",
          message: data.error || "Failed to fetch profile"
        }));
      }
    } catch {
      dispatch(addError({
        title: "Network Error",
        message: "Failed to connect to server"
      }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  /**
   * Effect: Profile Update
   * Ensures the UI reflects the latest account state.
   * Redirects if not logged in.
   */
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    fetchProfile();
  }, [session, status, router, fetchProfile]);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_email",
          email,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        dispatch(addSuccess({
          title: "Email Updated",
          message: "Your email address has been updated successfully"
        }));
        setProfile(prev => prev ? { ...prev, email } : null);
      } else {
        setEmailError(data.error || "Failed to update email");
        dispatch(addError({
          title: "Update Failed",
          message: data.error || "Failed to update email"
        }));
      }
    } catch {
      dispatch(addError({
        title: "Network Error",
        message: "Failed to connect to server"
      }));
    } finally {
      setEmailLoading(false);
    }
  };

  /**
   * Logic: Change Password
   * Updates your password on the server.
   */
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof passwordFieldErrors = {};

    if (!currentPassword) newErrors.current = "Current password is required";
    if (!newPassword) newErrors.new = "New password is required";
    else {
      const requirements = validatePassword(newPassword);
      if (requirements.length > 0) {
        newErrors.new = `Missing: ${requirements.join(", ")}`;
      }
    }
    if (newPassword !== confirmPassword) newErrors.confirm = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setPasswordFieldErrors(newErrors);
      return;
    }

    setPasswordLoading(true);
    setPasswordFieldErrors({});

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        dispatch(addSuccess({
          title: "Password Changed",
          message: "Your password has been updated successfully"
        }));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        dispatch(addError({
          title: "Password Change Failed",
          message: data.error || "Failed to change password"
        }));
        if (data.error?.toLowerCase().includes("current")) {
          setPasswordFieldErrors({ current: "Incorrect current password" });
        }
      }
    } catch {
      dispatch(addError({
        title: "Network Error",
        message: "Failed to connect to server"
      }));
    } finally {
      setPasswordLoading(false);
    }
  };

  const validatePassword = (pwd: string) => {
    const errors = [];
    if (pwd.length < 8) errors.push("at least 8 characters");
    if (!/(?=.*[a-z])/.test(pwd)) errors.push("one lowercase letter");
    if (!/(?=.*[A-Z])/.test(pwd)) errors.push("one uppercase letter");
    if (!/(?=.*\d)/.test(pwd)) errors.push("one number");
    return errors;
  };

  const requirements = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword;

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-error">Failed to load profile</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-content">
        {/* Header Section */}
        <header className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Profile Settings</h1>
            <p className="text-content-muted mt-1">Manage your account information and security</p>
          </div>
          <div className="badge badge-primary">
            <ShieldCheck className="w-4 h-4" />
            Verified Account
          </div>
        </header>

        <div className="section">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              {/* Identity Profile */}
              <div className="card p-8">
                <div className="p-8 bg-primary-subtle rounded-lg mb-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-lg bg-surface-card flex items-center justify-center">
                      <User className="w-10 h-10 text-primary-text" />
                    </div>
                    <div className="text-center md:text-left">
                      <h2 className="text-2xl font-bold text-content-primary mb-2">{profile.name}</h2>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span className="badge badge-neutral">
                          ID: {profile.id}
                        </span>
                        <span className="badge badge-primary">
                          {profile.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-primary-text" />
                      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide">Department</h3>
                    </div>
                    <p className="text-lg font-semibold text-content-primary">{profile.department || "Organization Wide"}</p>
                  </div>
                  
                  <div className="card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="w-4 h-4 text-primary-text" />
                      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide">Email</h3>
                    </div>
                    <p className="text-lg font-semibold text-content-primary">{profile.email}</p>
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-content-primary">Change Password</h2>
                <div className="card p-8">
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        type="password"
                        label="Current Password"
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          if (passwordFieldErrors.current) setPasswordFieldErrors(prev => ({ ...prev, current: undefined }));
                        }}
                        error={passwordFieldErrors.current}
                        required
                        disabled={passwordLoading}
                      />
                      <Input
                        type="password"
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (passwordFieldErrors.new) setPasswordFieldErrors(prev => ({ ...prev, new: undefined }));
                        }}
                        error={passwordFieldErrors.new}
                        required
                        disabled={passwordLoading}
                      />
                      <Input
                        type="password"
                        label="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordFieldErrors.confirm) setPasswordFieldErrors(prev => ({ ...prev, confirm: undefined }));
                        }}
                        error={passwordFieldErrors.confirm}
                        required
                        disabled={passwordLoading}
                      />
                    </div>

                    {newPassword && (
                      <div className="card p-4 bg-surface-muted">
                        <h4 className="text-sm font-semibold text-content-secondary mb-3 uppercase tracking-wide">Password Requirements</h4>
                        <div className="flex flex-wrap gap-2">
                          {requirements.map((error: string, index: number) => (
                            <span key={index} className="badge badge-error text-xs">
                              Missing: {error}
                            </span>
                          ))}
                          {requirements.length === 0 && (
                            <span className="badge badge-success text-xs">
                              <ShieldCheck className="w-3 h-3" />
                              All requirements met
                            </span>
                          )}
                          {confirmPassword && (
                            <span className={`badge text-xs ${passwordsMatch ? 'badge-success' : 'badge-error'}`}>
                              {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        passwordLoading ||
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword ||
                        requirements.length > 0 ||
                        !passwordsMatch
                      }
                      icon={passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                      iconPosition="right"
                      loading={passwordLoading}
                    >
                      {passwordLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Update Email */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-content-primary">Email Settings</h2>
                <div className="card p-6">
                  <form onSubmit={handleEmailUpdate} className="space-y-4">
                    <Input
                      type="email"
                      label="Email Address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      error={emailError}
                      required
                      disabled={emailLoading}
                    />

                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full"
                      disabled={emailLoading || email === profile.email}
                      icon={emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      iconPosition="right"
                      loading={emailLoading}
                    >
                      {emailLoading ? "Updating..." : "Update Email"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Status Card */}
              <div className="card p-6 bg-primary-subtle">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-5 h-5 text-primary-text" />
                  <h3 className="text-lg font-bold text-primary-text">Account Status</h3>
                </div>
                <p className="text-content-secondary mb-4">
                  Your profile is active and all changes are saved automatically.
                </p>
                <div className="badge badge-success w-full justify-center">
                  Status: Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}