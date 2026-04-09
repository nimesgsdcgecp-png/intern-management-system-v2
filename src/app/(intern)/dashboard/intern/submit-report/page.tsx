"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/lib/notifications";
import { submitReportSchema, mapZodErrors } from "@/lib/validations/schemas";
import { AlertTriangle } from "lucide-react";

const initialReportValues = {
  date: new Date().toISOString().split("T")[0],
  title: "",
  hoursWorked: "",
  tasksCompleted: "",
  challengesFaced: "",
  workDescription: "",
};

export default function SubmitReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const reportFormik = useFormik({
    initialValues: initialReportValues,
    validate: (values) => {
      const result = submitReportSchema.safeParse(values);
      if (result.success) return {};
      const errors = mapZodErrors(result.error);
      if (errors.date) {
        errors.date = errors.date.replace("Report date", "Date");
      }
      return errors;
    },
    onSubmit: async (values, helpers) => {
      setLoading(true);
      helpers.setSubmitting(true);

    try {
      // Combine all fields into workDescription with proper formatting
      let fullDescription = "";
      
      if (values.title.trim()) {
        fullDescription = `# ${values.title.trim()}\n\n`;
      }
      
      if (values.tasksCompleted.trim()) {
        fullDescription += `## Tasks Completed\n${values.tasksCompleted.trim()}\n\n`;
      }
      
      fullDescription += values.workDescription;
      
      if (values.challengesFaced.trim()) {
        fullDescription += `\n\n## Challenges Faced\n${values.challengesFaced.trim()}`;
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: values.date,
          workDescription: fullDescription,
          hoursWorked: parseFloat(values.hoursWorked),
        }),
      });

      if (res.ok) {
        showToast("Report submitted successfully", "success");
        helpers.resetForm({ values: initialReportValues });
        router.push("/dashboard/intern/reports");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to submit report", "error");
      }
    } catch {
      showToast("Network error. Please check your connection", "error");
    } finally {
      setLoading(false);
      helpers.setSubmitting(false);
    }
    },
  });

  const handleReset = () => {
    reportFormik.resetForm({ values: initialReportValues });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            Submit Daily Report
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            Document your daily progress and achievements
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          <form onSubmit={reportFormik.handleSubmit} className="space-y-10">
            {reportFormik.submitCount > 0 && Object.keys(reportFormik.errors).length > 0 && (
              <div className="alert alert-error">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">Please fix the errors below before submitting.</p>
              </div>
            )}
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input
                label="Date"
                type="date"
                name="date"
                value={reportFormik.values.date}
                onChange={reportFormik.handleChange}
                onBlur={reportFormik.handleBlur}
                required
                error={reportFormik.touched.date ? reportFormik.errors.date : undefined}
              />

              <Input
                label="Hours Worked"
                type="number"
                name="hoursWorked"
                value={reportFormik.values.hoursWorked}
                onChange={reportFormik.handleChange}
                onBlur={reportFormik.handleBlur}
                required
                min="0.5"
                max="12"
                step="0.5"
                placeholder="e.g., 8"
                error={reportFormik.touched.hoursWorked ? reportFormik.errors.hoursWorked : undefined}
              />

              <div className="md:col-span-2">
                <Input
                  label="Title"
                  type="text"
                  name="title"
                  value={reportFormik.values.title}
                  onChange={reportFormik.handleChange}
                  onBlur={reportFormik.handleBlur}
                  placeholder="Brief summary of the day's work (optional)"
                  error={reportFormik.touched.title ? reportFormik.errors.title : undefined}
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Tasks Completed"
                  name="tasksCompleted"
                  value={reportFormik.values.tasksCompleted}
                  onChange={reportFormik.handleChange}
                  onBlur={reportFormik.handleBlur}
                  rows={4}
                  placeholder="List the tasks you completed today (optional)"
                  error={reportFormik.touched.tasksCompleted ? reportFormik.errors.tasksCompleted : undefined}
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Challenges Faced"
                  name="challengesFaced"
                  value={reportFormik.values.challengesFaced}
                  onChange={reportFormik.handleChange}
                  onBlur={reportFormik.handleBlur}
                  rows={4}
                  placeholder="Describe any challenges or blockers (optional)"
                  error={reportFormik.touched.challengesFaced ? reportFormik.errors.challengesFaced : undefined}
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Work Description"
                  name="workDescription"
                  value={reportFormik.values.workDescription}
                  onChange={reportFormik.handleChange}
                  onBlur={reportFormik.handleBlur}
                  required
                  rows={6}
                  placeholder="Provide a detailed description of your work today"
                  error={reportFormik.touched.workDescription ? reportFormik.errors.workDescription : undefined}
                />
              </div>
            </div>

            {/* Form Footer */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={loading || reportFormik.isSubmitting}
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || reportFormik.isSubmitting}
              >
                {loading || reportFormik.isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
