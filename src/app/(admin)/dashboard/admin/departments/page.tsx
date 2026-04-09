"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { Building2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { showConfirm, showToast } from "@/lib/notifications";
import { z } from "zod";
import { mapZodErrors } from "@/lib/validations/schemas";

type DepartmentHead = {
  id: string;
  profile?: {
    name?: string;
  } | null;
} | null;

type DepartmentMentor = {
  id: string;
  name: string;
};

type DepartmentRow = {
  id: string;
  name: string;
  head_id: string | null;
  head: DepartmentHead;
  mentors: DepartmentMentor[];
  internsCount: number;
  mentorsCount: number;
};

const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .max(60, "Department name must be at most 60 characters"),
});

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRow | null>(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/departments");
      if (!response.ok) {
        showToast("Failed to fetch departments", "error");
        return;
      }
      const data = await response.json();
      setDepartments(data || []);
    } catch {
      showToast("Failed to fetch departments", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const formik = useFormik({
    initialValues: { name: "" },
    validate: (values) => {
      const parsed = departmentSchema.safeParse(values);
      if (parsed.success) return {};
      return mapZodErrors(parsed.error);
    },
    onSubmit: async (values, helpers) => {
      helpers.setSubmitting(true);
      try {
        const url = editing ? `/api/departments/${editing.id}` : "/api/departments";
        const method = editing ? "PATCH" : "POST";
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: values.name }),
        });

        if (!response.ok) {
          const errorBody = await response.json();
          showToast(errorBody?.error || "Failed to save department", "error");
          return;
        }

        showToast(editing ? "Department updated" : "Department created", "success");
        setIsOpen(false);
        setEditing(null);
        helpers.resetForm({ values: { name: "" } });
        fetchDepartments();
      } catch {
        showToast("Failed to save department", "error");
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const openCreate = () => {
    setEditing(null);
    formik.resetForm({ values: { name: "" } });
    setIsOpen(true);
  };

  const openEdit = (department: DepartmentRow) => {
    setEditing(department);
    formik.resetForm({ values: { name: department.name } });
    setIsOpen(true);
  };

  const handleDelete = async (department: DepartmentRow) => {
    const confirmation = await showConfirm(
      "Delete Department?",
      `Are you sure you want to delete "${department.name}"?`
    );
    if (!confirmation.isConfirmed) return;

    try {
      const response = await fetch(`/api/departments/${department.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json();
        showToast(body?.error || "Failed to delete department", "error");
        return;
      }
      showToast("Department deleted", "success");
      fetchDepartments();
    } catch {
      showToast("Failed to delete department", "error");
    }
  };

  const handleHeadChange = async (departmentId: string, headId: string) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ head_id: headId || null }),
      });
      if (!response.ok) {
        const body = await response.json();
        showToast(body?.error || "Failed to set department head", "error");
        return;
      }
      showToast("Department head updated", "success");
      fetchDepartments();
    } catch {
      showToast("Failed to set department head", "error");
    }
  };

  const rows = useMemo(() => departments, [departments]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Department Management</h1>
            <p className="text-sm text-content-secondary mt-1">
              Manage departments, assign heads, and monitor mentor/intern counts.
            </p>
          </div>
          <Button onClick={openCreate} icon={<PlusCircle className="w-4 h-4" />}>
            Add Department
          </Button>
        </div>

        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={editing ? "Edit Department" : "Add Department"}
          size="md"
        >
          <form onSubmit={formik.handleSubmit} className="space-y-5">
            <Input
              label="Department Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name ? formik.errors.name : undefined}
              required
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={formik.isSubmitting}>
                {editing ? "Save Changes" : "Create Department"}
              </Button>
            </div>
          </form>
        </Modal>

        <div className="table-container">
          {loading ? (
            <div className="p-8 text-sm text-content-secondary">Loading departments...</div>
          ) : rows.length === 0 ? (
            <div className="p-10 flex flex-col items-center gap-3 text-content-secondary">
              <Building2 className="w-10 h-10" />
              <p>No departments found.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Head</th>
                    <th>Interns</th>
                    <th>Mentors</th>
                    <th>Set as Head</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((department) => (
                    <tr key={department.id}>
                      <td className="font-medium text-content-primary">{department.name}</td>
                      <td>{department.head?.profile?.name || "None"}</td>
                      <td>{department.internsCount}</td>
                      <td>{department.mentorsCount}</td>
                      <td>
                        <select
                          className="select"
                          value={department.head_id || ""}
                          onChange={(event) => handleHeadChange(department.id, event.target.value)}
                        >
                          <option value="">None</option>
                          {department.mentors.map((mentor) => (
                            <option key={mentor.id} value={mentor.id}>
                              {mentor.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-ghost"
                            onClick={() => openEdit(department)}
                            title="Edit department"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-ghost btn-icon-delete"
                            onClick={() => handleDelete(department)}
                            title="Delete department"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
