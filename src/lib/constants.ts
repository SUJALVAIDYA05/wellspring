/**
 * Application constants and configuration values.
 * Sourced from backend.md and content.md.
 */

export const APP_CONFIG = {
  // Hospital local timezone (IANA). Do not assume server timezone equals hospital timezone.
  DEFAULT_TIMEZONE: process.env.HOSPITAL_TIMEZONE || "America/New_York",
  
  // Default appointment duration in minutes
  DEFAULT_SLOT_DURATION_MINUTES: 30,

  // Pending appointment hold expiry in minutes (to avoid indefinite holds)
  PENDING_SLOT_HOLD_MINUTES: Number(process.env.PENDING_SLOT_HOLD_MINUTES) || 15,

  // Booking reference code prefix
  BOOKING_CODE_PREFIX: "APT",
} as const;

export const APPOINTMENT_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW",
} as const;

export const ROLES = {
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
  PUBLIC: "PUBLIC",
} as const;
