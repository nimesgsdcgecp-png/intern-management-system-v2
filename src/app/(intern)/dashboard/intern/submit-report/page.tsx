"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/lib/notifications";

export default function SubmitReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    title: "",
    hoursWorked: "",
    tasksCompleted: "",
    challengesFaced: "",
    workDescription: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        newErrors.date = "Date cannot be in the future";
      }
    }
    
    const hours = parseFloat(formData.hoursWorked);
    if (!formData.hoursWorked || isNaN(hours) || hours < 0.5 || hours > 24) {
      newErrors.hoursWorked = "Hours must be between 0.5 and 24";
    }

    if (!formData.workDescription.trim()) {
      newErrors.workDescription = "Work description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);

    try {
      // Combine all fields into workDescription with proper formatting
      let fullDescription = "";
      
      if (formData.title.trim()) {
        fullDescription = `# ${formData.title.trim()}\n\n`;
      }
      
      if (formData.tasksCompleted.trim()) {
        fullDescription += `## Tasks Completed\n${formData.tasksCompleted.trim()}\n\n`;
      }
      
      fullDescription += formData.workDescription;
      
      if (formData.challengesFaced.trim()) {
        fullDescription += `\n\n## Challenges Faced\n${formData.challengesFaced.trim()}`;
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          workDescription: fullDescription,
          hoursWorked: parseFloat(formData.hoursWorked),
        }),
      });

      if (res.ok) {
        showToast("Report submitted successfully", "success");
        setFormData({
          date: new Date().toISOString().split("T")[0],
          title: "",
          hoursWorked: "",
          tasksCompleted: "",
          challengesFaced: "",
          workDescription: "",
        });
        setErrors({});
        router.push("/dashboard/intern/reports");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to submit report", "error");
      }
    } catch {
      showToast("Network error. Please check your connection", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      title: "",
      hoursWorked: "",
      tasksCompleted: "",
      challengesFaced: "",
      workDescription: "",
    });
    setErrors({});
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
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input
                label="Date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                error={errors.date}
              />

              <Input
                label="Hours Worked"
                type="number"
                name="hoursWorked"
                value={formData.hoursWorked}
                onChange={handleInputChange}
                required
                min="0.5"
                max="24"
                step="0.5"
                placeholder="e.g., 8"
                error={errors.hoursWorked}
              />

              <div className="md:col-span-2">
                <Input
                  label="Title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief summary of the day's work (optional)"
                  error={errors.title}
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Tasks Completed"
                  name="tasksCompleted"
                  value={formData.tasksCompleted}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="List the tasks you completed today (optional)"
                  error={errors.tasksCompleted}
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Challenges Faced"
                  name="challengesFaced"
                  value={formData.challengesFaced}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe any challenges or blockers (optional)"
                  error={errors.challengesFaced}
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Work Description"
                  name="workDescription"
                  value={formData.workDescription}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  placeholder="Provide a detailed description of your work today"
                  error={errors.workDescription}
                />
              </div>
            </div>

            {/* Form Footer */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
