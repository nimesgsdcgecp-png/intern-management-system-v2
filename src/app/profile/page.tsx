"use client";

import { useState, useEffect, useCallback } from "react";
import { useFormik } from "formik";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addSuccess, addError } from "@/lib/redux/slices/notificationSlice";
import { User, Mail, ShieldCheck, Key, Building2, Save, Loader2, Activity, AlertTriangle, BadgeCheck, Hourglass } from "lucide-react";
import { graduationDegrees, profileEmailSchema, passwordSchema, mapZodErrors } from "@/lib/validations/schemas";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone?: string;
  endDate?: string;
  collegeName?: string;
  university?: string;
  graduationDegree?: string;
  profileVerified?: boolean;
  profileVerifiedBy?: string;
  profileVerifiedAt?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const validatePassword = (pwd: string) => {
    const errors = [];
    if (pwd.length < 8) errors.push("at least 8 characters");
    if (!/(?=.*[a-z])/.test(pwd)) errors.push("one lowercase letter");
    if (!/(?=.*[A-Z])/.test(pwd)) errors.push("one uppercase letter");
    if (!/(?=.*\d)/.test(pwd)) errors.push("one number");
    if (!/[@$!%*?&]/.test(pwd)) errors.push("one special character (@$!%*?&)");
    return errors;
  };
  
  const emailFormik = useFormik({
    initialValues: { email: profile?.email || "" },
    enableReinitialize: true,
    validate: (values) => {
      const result = profileEmailSchema(profile?.email).safeParse(values);
      if (result.success) return {};
      return mapZodErrors(result.error);
    },
    onSubmit: async (values, helpers) => {
      helpers.setSubmitting(true);
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_email",
            email: values.email,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          dispatch(addSuccess({
            title: "Email Updated",
            message: "Your email address has been updated successfully"
          }));
          setProfile(prev => prev ? { ...prev, email: values.email } : null);
        } else {
          helpers.setErrors({ email: data.error || "Failed to update email" });
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
        helpers.setSubmitting(false);
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: { current: "", new: "", confirm: "" },
    validate: async (values) => {
      const result = passwordSchema.safeParse(values);
      const errors: Record<string, string> = result.success ? {} : mapZodErrors(result.error);

      if (!errors.new && values.new && values.new.length >= 8) {
        try {
          const res = await fetch("/api/auth/password-breach", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: values.new }),
          });

          if (res.ok) {
            const data = await res.json();
            if ((data?.count ?? 0) > 0) {
              errors.new =
                "This password was found in known data breach lists. Please choose a unique password.";
            }
          }
        } catch {
          // Fail-open for breach API checks; base password validation still applies.
        }
      }

      return errors;
    },
    onSubmit: async (values, helpers) => {
      helpers.setSubmitting(true);
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "change_password",
            currentPassword: values.current,
            newPassword: values.new,
            confirmPassword: values.confirm,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          dispatch(addSuccess({
            title: "Password Changed",
            message: "Your password has been updated successfully"
          }));
          helpers.resetForm();
        } else {
          if (data.error === "PASSWORD_BREACHED") {
            helpers.setFieldTouched("new", true, false);
            helpers.setErrors({
              new:
                "This password was found in known data breach lists. Please choose a unique password.",
            });
            return;
          }

          dispatch(addError({
            title: "Password Change Failed",
            message: data.error || "Failed to change password"
          }));
          if (data.error?.toLowerCase().includes("current")) {
            helpers.setErrors({ current: "Incorrect current password" });
          }
        }
      } catch {
        dispatch(addError({
          title: "Network Error",
          message: "Failed to connect to server"
        }));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const internDetailsFormik = useFormik({
    initialValues: {
      phone: profile?.phone || "",
      collegeName: profile?.collegeName || "",
      university: profile?.university || "",
      graduationDegree: profile?.graduationDegree || "",
      endDate: profile?.endDate || "",
    },
    enableReinitialize: true,
    onSubmit: async (values, helpers) => {
      helpers.setSubmitting(true);
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_intern_details",
            ...values,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          dispatch(addError({
            title: "Update Failed",
            message: data.error || "Failed to update internship details",
          }));
          return;
        }
        dispatch(addSuccess({
          title: "Details Updated",
          message: "Internship details updated and marked for verification",
        }));
        setProfile((prev) => prev ? {
          ...prev,
          ...values,
          profileVerified: false,
          profileVerifiedBy: "",
          profileVerifiedAt: "",
        } : prev);
      } catch {
        dispatch(addError({
          title: "Network Error",
          message: "Failed to connect to server",
        }));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const requirements = validatePassword(passwordFormik.values.new);
  const passwordsMatch = passwordFormik.values.new === passwordFormik.values.confirm;

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
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">My Profile</h1>
            <p className="text-sm text-content-secondary mt-1">
              Manage your account settings and information
            </p>
          </div>
          <div className="badge badge-primary">
            <ShieldCheck className="w-4 h-4" />
            Verified Account
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="card p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-surface-muted flex items-center justify-center text-lg font-bold text-content-primary">
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-content-primary">{profile.name}</h2>
                <p className="text-sm text-content-secondary">{profile.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="badge badge-primary">{profile.role}</span>
              <span className="badge badge-neutral">{profile.department || "Organization Wide"}</span>
            </div>

            <div className="space-y-3 text-sm text-content-secondary">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-content-muted" />
                <span>User ID: {profile.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-content-muted" />
                <span>Department: {profile.department || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-content-muted" />
                <span>Email: {profile.email}</span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-content-primary">Personal Information</h3>
                <p className="text-sm text-content-secondary">
                  Update your email address. Changes require verification.
                </p>
              </div>
              <form onSubmit={emailFormik.handleSubmit} className="space-y-4">
                {emailFormik.submitCount > 0 && Object.keys(emailFormik.errors).length > 0 && (
                  <div className="alert alert-error">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <p className="text-xs font-medium">Please fix the errors below before submitting.</p>
                  </div>
                )}
                <Input
                  type="email"
                  name="email"
                  label="Email Address"
                  value={emailFormik.values.email}
                  onChange={emailFormik.handleChange}
                  onBlur={emailFormik.handleBlur}
                  error={emailFormik.touched.email ? emailFormik.errors.email : undefined}
                  required
                  disabled={emailFormik.isSubmitting}
                />

                <Button
                  type="submit"
                  variant="secondary"
                  disabled={emailFormik.isSubmitting || emailFormik.values.email === profile.email}
                  icon={emailFormik.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  iconPosition="right"
                  loading={emailFormik.isSubmitting}
                >
                  {emailFormik.isSubmitting ? "Updating..." : "Update Email"}
                </Button>
              </form>
            </div>

            {/* Security */}
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-content-primary">Security</h3>
                <p className="text-sm text-content-secondary">Change your account password.</p>
              </div>
              <form onSubmit={passwordFormik.handleSubmit} className="space-y-6">
                {passwordFormik.submitCount > 0 && Object.keys(passwordFormik.errors).length > 0 && (
                  <div className="alert alert-error">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <p className="text-xs font-medium">Please fix the errors below before submitting.</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    type="password"
                    showPasswordToggle
                    name="current"
                    label="Current Password"
                    value={passwordFormik.values.current}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.current ? passwordFormik.errors.current : undefined}
                    required
                    disabled={passwordFormik.isSubmitting}
                  />
                  <Input
                    type="password"
                    showPasswordToggle
                    name="new"
                    label="New Password"
                    value={passwordFormik.values.new}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.new ? passwordFormik.errors.new : undefined}
                    required
                    disabled={passwordFormik.isSubmitting}
                  />
                  <Input
                    type="password"
                    showPasswordToggle
                    name="confirm"
                    label="Confirm Password"
                    value={passwordFormik.values.confirm}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.confirm ? passwordFormik.errors.confirm : undefined}
                    required
                    disabled={passwordFormik.isSubmitting}
                  />
                </div>

                {passwordFormik.values.new && (
                  <div className="card p-4 bg-surface-muted">
                    <h4 className="text-sm font-semibold text-content-secondary mb-3 uppercase tracking-wide">
                      Password Requirements
                    </h4>
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
                      {passwordFormik.values.confirm && (
                        <span className={`badge text-xs ${passwordsMatch ? "badge-success" : "badge-error"}`}>
                          {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    passwordFormik.isSubmitting ||
                    !passwordFormik.values.current ||
                    !passwordFormik.values.new ||
                    !passwordFormik.values.confirm ||
                    requirements.length > 0 ||
                    !passwordsMatch
                  }
                  icon={passwordFormik.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  iconPosition="right"
                  loading={passwordFormik.isSubmitting}
                >
                  {passwordFormik.isSubmitting ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </div>

            {/* Account Status */}
            <div className="card p-6 bg-primary-subtle">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-primary-text" />
                <h3 className="text-lg font-bold text-primary-text">Account Status</h3>
              </div>
              <p className="text-content-secondary mb-4">
                Your profile is active and all changes are saved automatically.
              </p>
              <div className="badge badge-success w-full justify-center">Status: Active</div>
            </div>

            {profile.role === "intern" && (
              <div className="card p-6 space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-content-primary">Internship Details</h3>
                    <p className="text-sm text-content-secondary">
                      Keep your internship profile updated for mentor/admin verification.
                    </p>
                  </div>
                  <span
                    className={`badge ${profile.profileVerified ? "badge-success" : "badge-warning"}`}
                    title={
                      profile.profileVerified
                        ? `Verified on ${profile.profileVerifiedAt ? new Date(profile.profileVerifiedAt).toLocaleString() : "N/A"}`
                        : "Pending verification"
                    }
                  >
                    {profile.profileVerified ? <BadgeCheck className="w-3 h-3" /> : <Hourglass className="w-3 h-3" />}
                    {profile.profileVerified ? "✓ Verified" : "⏳ Pending Verification"}
                  </span>
                </div>

                <form onSubmit={internDetailsFormik.handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Phone"
                      name="phone"
                      value={internDetailsFormik.values.phone}
                      onChange={internDetailsFormik.handleChange}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      name="endDate"
                      value={internDetailsFormik.values.endDate}
                      onChange={internDetailsFormik.handleChange}
                    />
                    <Input
                      label="College Name"
                      name="collegeName"
                      value={internDetailsFormik.values.collegeName}
                      onChange={internDetailsFormik.handleChange}
                    />
                    <Input
                      label="University"
                      name="university"
                      value={internDetailsFormik.values.university}
                      onChange={internDetailsFormik.handleChange}
                    />
                    <Select
                      label="Graduation Degree"
                      name="graduationDegree"
                      value={internDetailsFormik.values.graduationDegree}
                      onChange={internDetailsFormik.handleChange}
                    >
                      <option value="">Select degree</option>
                      {graduationDegrees.map((degree) => (
                        <option key={degree} value={degree}>{degree}</option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    disabled={internDetailsFormik.isSubmitting}
                    loading={internDetailsFormik.isSubmitting}
                    icon={internDetailsFormik.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    {internDetailsFormik.isSubmitting ? "Saving..." : "Save Internship Details"}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
