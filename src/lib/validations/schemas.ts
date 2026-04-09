import { z, ZodError } from "zod";

const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
const noNumberNameRegex = /^[^0-9]+$/;
const passwordSpecialRegex = /[@$!%*?&]/;

const toDayStart = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isValidDateString = (value: string) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const graduationDegrees = [
  "B.Tech",
  "B.E.",
  "MCA",
  "BCA",
  "M.Tech",
  "MBA",
  "B.Sc",
  "M.Sc",
  "Other",
] as const;

export const createInternSchema = (departments: string[]) =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters")
        .refine((value) => noNumberNameRegex.test(value), "Name cannot contain numbers"),
      email: emailSchema,
      phone: z
        .string()
        .trim()
        .optional()
        .or(z.literal(""))
        .refine((value) => !value || phoneRegex.test(value), "Phone must be a valid phone number"),
      department: z
        .string()
        .trim()
        .min(1, "Department is required")
        .refine((value) => departments.includes(value), "Please select a valid department"),
      mentorId: z.string().trim().min(1, "Please assign a mentor"),
      startDate: z
        .string()
        .trim()
        .min(1, "Start date is required")
        .refine(isValidDateString, "Start date must be a valid date"),
      endDate: z
        .string()
        .trim()
        .optional()
        .or(z.literal(""))
        .refine((value) => !value || isValidDateString(value), "End date must be a valid date"),
      collegeName: z.string().trim().max(150, "College name must be at most 150 characters").optional().or(z.literal("")),
      university: z.string().trim().max(150, "University must be at most 150 characters").optional().or(z.literal("")),
      graduationDegree: z.enum(graduationDegrees).optional().or(z.literal("")),
    })
    .refine(
      (values) => !values.endDate || new Date(values.endDate) >= new Date(values.startDate),
      {
        path: ["endDate"],
        message: "End date must be on or after start date",
      }
    );

export const createMentorSchema = (departments: string[]) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters")
      .refine((value) => noNumberNameRegex.test(value), "Name cannot contain numbers"),
    email: emailSchema,
    department: z
      .string()
      .trim()
      .min(1, "Department is required")
      .refine((value) => departments.includes(value), "Please select a valid department"),
    phone: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || phoneRegex.test(value), "Phone must be a valid phone number"),
    role: z.literal("mentor"),
  });

export const taskFormSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title must be at most 200 characters"),
    description: z.string().trim().max(2000, "Description must be at most 2000 characters").optional().or(z.literal("")),
    assignedInterns: z.array(z.string()),
    assignedToAll: z.boolean().optional().default(false),
    deadline: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || isValidDateString(value), "Deadline must be a valid date")
      .refine((value) => {
        if (!value) return true;
        return toDayStart(new Date(value)) >= toDayStart(new Date());
      }, "Deadline must be today or a future date"),
    priority: z.enum(["low", "medium", "high"], {
      errorMap: () => ({ message: "Priority is required" }),
    }),
    status: z.string().optional(),
    sendEmail: z.boolean().optional(),
  })
  .refine((values) => Boolean(values.assignedToAll) || values.assignedInterns.length > 0, {
    path: ["assignedInterns"],
    message: "Select at least one intern or assign to all",
  });

export const submitReportSchema = z.object({
  date: z
    .string()
    .trim()
    .min(1, "Report date is required")
    .refine(isValidDateString, "Report date must be valid")
    .refine((value) => toDayStart(new Date(value)) <= toDayStart(new Date()), "Report date cannot be in the future"),
  title: z.string().optional(),
  hoursWorked: z.coerce
    .number({ invalid_type_error: "Hours worked is required" })
    .min(0.5, "Hours worked must be between 0.5 and 12")
    .max(12, "Hours worked must be between 0.5 and 12"),
  tasksCompleted: z.string().optional(),
  challengesFaced: z.string().optional(),
  workDescription: z
    .string()
    .trim()
    .min(20, "Work description must be at least 20 characters")
    .max(3000, "Work description must be at most 3000 characters"),
});

export const profileEmailSchema = (currentEmail?: string) =>
  z.object({
    email: emailSchema.refine(
      (value) => !currentEmail || value.toLowerCase() !== currentEmail.toLowerCase(),
      "New email must be different from current email"
    ),
  });

export const passwordSchema = z
  .object({
    current: z.string().min(1, "Current password is required"),
    new: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .refine((value) => /[a-z]/.test(value), "New password must contain at least one lowercase letter")
      .refine((value) => /[A-Z]/.test(value), "New password must contain at least one uppercase letter")
      .refine((value) => /\d/.test(value), "New password must contain at least one digit")
      .refine((value) => passwordSpecialRegex.test(value), "New password must contain at least one special character (@$!%*?&)"),
    confirm: z.string().min(1, "Confirm password is required"),
  })
  .refine((values) => values.new === values.confirm, {
    path: ["confirm"],
    message: "Confirm password must match new password",
  });

export const adminResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .refine((value) => /[a-z]/.test(value), "New password must contain at least one lowercase letter")
      .refine((value) => /[A-Z]/.test(value), "New password must contain at least one uppercase letter")
      .refine((value) => /\d/.test(value), "New password must contain at least one digit")
      .refine((value) => passwordSpecialRegex.test(value), "New password must contain at least one special character (@$!%*?&)"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Confirm password must match new password",
  });

export const mapZodErrors = <T>(error: ZodError<T>) => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }
  return fieldErrors;
};
