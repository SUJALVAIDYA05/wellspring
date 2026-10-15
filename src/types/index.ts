/**
 * Domain types for the Hospital Website project.
 * Defined strictly according to backend.md and features.md specifications.
 */

export type StaffRole = "ADMIN" | "EMPLOYEE" | "PUBLIC";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export interface Department {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  departmentId: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Doctor {
  id: string;
  slug: string;
  fullName: string;
  specialty: string;
  departmentId: string;
  qualifications: string[];
  biography?: string;
  photoUrl?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface DoctorScheduleException {
  id: string;
  doctorId: string;
  startsAt: Date | string;
  endsAt: Date | string;
  reason?: string;
  createdAt: Date | string;
}

export interface Appointment {
  id: string;
  referenceCode: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  doctorId: string;
  startsAt: Date | string; // Stored consistently in UTC
  endsAt: Date | string; // Stored consistently in UTC
  status: AppointmentStatus;
  reasonForVisit?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
  cancellationReason?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
}

/**
 * Public Booking Input & Response DTOs
 */
export interface CreateAppointmentInput {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  departmentId?: string;
  doctorId: string;
  startsAt: string; // ISO 8601 UTC string
  endsAt: string; // ISO 8601 UTC string
  reasonForVisit?: string;
}

export interface AppointmentPublicResponse {
  referenceCode: string;
  status: AppointmentStatus;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
