import { z } from "zod";
import { AppointmentStatus, StaffRole } from "@prisma/client";

// Phone number regex allowing international and local formats
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{5,15}$/;

export const createAppointmentSchema = z.object({
  patientName: z
    .string()
    .trim()
    .min(2, "Patient name must be at least 2 characters")
    .max(100, "Patient name is too long"),
  patientPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "Please enter a valid phone number"),
  patientEmail: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  doctorId: z.string().uuid("Invalid doctor identifier"),
  departmentId: z.string().optional().or(z.literal("")),
  startsAt: z.string().datetime({ message: "startsAt must be a valid ISO 8601 UTC timestamp" }),
  reasonForVisit: z
    .string()
    .trim()
    .max(500, "Reason for visit must not exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export const updateAppointmentSchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"] as const)
    .optional(),
  cancellationReason: z
    .string()
    .trim()
    .max(500)
    .optional(),
  startsAt: z
    .string()
    .datetime({ message: "startsAt must be a valid ISO 8601 UTC timestamp" })
    .optional(),
  doctorId: z.string().uuid().optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const staffLoginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const availabilityQuerySchema = z.object({
  from: z.string().min(1, "'from' query parameter is required"),
  to: z.string().min(1, "'to' query parameter is required"),
});

export const staffAppointmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  doctorId: z.string().uuid().optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"] as const)
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  referenceCode: z.string().trim().optional(),
});

export const createDoctorSchema = z.object({
  slug: z.string().trim().min(2).max(100),
  fullName: z.string().trim().min(2).max(100),
  specialty: z.string().trim().min(2).max(100),
  departmentId: z.string().uuid(),
  qualifications: z.array(z.string()).default([]),
  biography: z.string().trim().optional(),
  photoUrl: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const updateDoctorSchema = createDoctorSchema.partial();

export const createDepartmentSchema = z.object({
  slug: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(100),
  summary: z.string().trim().min(5).max(300),
  description: z.string().trim().min(10),
  isActive: z.boolean().default(true),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const createServiceSchema = z.object({
  slug: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(100),
  summary: z.string().trim().min(5).max(300),
  description: z.string().trim().min(10),
  departmentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export const createStaffUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "EMPLOYEE"] as const).default("EMPLOYEE"),
  isActive: z.boolean().default(true),
});

export const updateStaffUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "EMPLOYEE"] as const).optional(),
  isActive: z.boolean().optional(),
});
