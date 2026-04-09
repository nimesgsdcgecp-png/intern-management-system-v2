"use client";

import React, { useState } from 'react';
import { useFormik } from "formik";
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { showToast } from '@/lib/notifications';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { adminResetPasswordSchema, mapZodErrors } from "@/lib/validations/schemas";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userName: string | null;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formik = useFormik({
    initialValues: { password: "", confirmPassword: "" },
    validate: (values) => {
      const result = adminResetPasswordSchema.safeParse(values);
      if (result.success) return {};
      return mapZodErrors(result.error);
    },
    onSubmit: async (values, helpers) => {
      setSubmitError(null);
      setLoading(true);
      helpers.setSubmitting(true);
      try {
        const res = await fetch('/api/auth/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, password: values.password }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update password");
        }

        showToast(`Password for ${userName} updated successfully`, 'success');
        helpers.resetForm();
        onClose();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setSubmitError(message);
        showToast(message, 'error');
      } finally {
        setLoading(false);
        helpers.setSubmitting(false);
      }
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) {
          setSubmitError(null);
          formik.resetForm();
          onClose();
        }
      }}
      title="Administrative Password Reset"
      size="md"
    >
      <div className="space-y-6">
        <div className="alert alert-warning">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Security Notice</p>
            <p className="text-xs leading-relaxed mt-1">
              You are about to change the password for <span className="font-bold">{userName}</span>. 
              The user will need to use this new password to log in immediately.
            </p>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {formik.submitCount > 0 && Object.keys(formik.errors).length > 0 && (
            <div className="alert alert-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-xs font-medium">Please fix the errors below before submitting.</p>
            </div>
          )}
          <Input
            label="New Password"
            type="password"
            showPasswordToggle
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="••••••••"
            required
            disabled={loading || formik.isSubmitting}
            leftIcon={<Lock className="w-4 h-4" />}
            error={formik.touched.password ? formik.errors.password : undefined}
          />
          <Input
            label="Confirm Password"
            type="password"
            showPasswordToggle
            name="confirmPassword"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="••••••••"
            required
            disabled={loading || formik.isSubmitting}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
            error={formik.touched.confirmPassword ? formik.errors.confirmPassword : undefined}
          />

          {submitError && (
            <div className="alert alert-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-xs font-medium">{submitError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!loading && !formik.isSubmitting) {
                  setSubmitError(null);
                  formik.resetForm();
                  onClose();
                }
              }}
              disabled={loading || formik.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || formik.isSubmitting}
            >
              {loading || formik.isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
