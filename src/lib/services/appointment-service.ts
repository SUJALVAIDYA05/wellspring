import crypto from "crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  AppError,
  NotFoundError,
  SlotConflictError,
  ValidationError,
} from "@/lib/errors";
import {
  getLocalParts,
  localToUtc,
  parseTimeString,
  getHospitalTimezone,
} from "@/lib/timezone";
import { recordAuditLog } from "@/lib/audit";
import { notificationService } from "@/lib/notifications";
import { AppointmentStatus, Prisma } from "@prisma/client";
import { StaffSession } from "@/lib/auth";

export interface AvailableSlot {
  startsAt: string; // ISO UTC
  endsAt: string; // ISO UTC
  time: string; // "09:00" in hospital timezone
  date: string; // "2026-10-22" in hospital timezone
}

export function generateReferenceCode(): string {
  // Format: APT-XXXX-XXXX using non-ambiguous uppercase characters
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(8);
  let code1 = "";
  let code2 = "";
  for (let i = 0; i < 4; i++) {
    code1 += alphabet[bytes[i] % alphabet.length];
    code2 += alphabet[bytes[i + 4] % alphabet.length];
  }
  return `APT-${code1}-${code2}`;
}

/**
 * Marks expired PENDING appointments as CANCELLED to release slots.
 */
export async function releaseExpiredPendingAppointments(
  tx: Prisma.TransactionClient = prisma,
  doctorId?: string
): Promise<number> {
  const expiryThreshold = new Date(
    Date.now() - env.PENDING_SLOT_HOLD_MINUTES * 60 * 1000
  );

  const whereClause: Prisma.AppointmentWhereInput = {
    status: AppointmentStatus.PENDING,
    createdAt: { lt: expiryThreshold },
    ...(doctorId ? { doctorId } : {}),
  };

  const result = await tx.appointment.updateMany({
    where: whereClause,
    data: {
      status: AppointmentStatus.CANCELLED,
      cancellationReason: "PENDING_EXPIRED",
    },
  });

  return result.count;
}

/**
 * Calculates server-verified available slots for a given doctor across a date range.
 */
export async function getDoctorAvailableSlots(
  doctorId: string,
  fromDateStr: string,
  toDateStr: string
): Promise<AvailableSlot[]> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      schedules: { where: { isActive: true } },
    },
  });

  if (!doctor || !doctor.isActive) {
    throw new NotFoundError("Doctor not found or currently inactive");
  }

  // Parse bounds
  let fromUtc: Date;
  let toUtc: Date;
  const timeZone = getHospitalTimezone();

  if (/^\d{4}-\d{2}-\d{2}$/.test(fromDateStr)) {
    const [y, m, d] = fromDateStr.split("-").map(Number);
    fromUtc = localToUtc(y, m, d, 0, 0, timeZone);
  } else {
    fromUtc = new Date(fromDateStr);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(toDateStr)) {
    const [y, m, d] = toDateStr.split("-").map(Number);
    toUtc = localToUtc(y, m, d, 23, 59, timeZone);
  } else {
    toUtc = new Date(toDateStr);
  }

  if (isNaN(fromUtc.getTime()) || isNaN(toUtc.getTime())) {
    throw new ValidationError("Invalid 'from' or 'to' date parameters");
  }

  // Release expired pending appointments first
  await releaseExpiredPendingAppointments(prisma, doctorId);

  // Retrieve schedule exceptions and active blocking appointments
  const [exceptions, appointments] = await Promise.all([
    prisma.doctorScheduleException.findMany({
      where: {
        doctorId,
        startsAt: { lt: toUtc },
        endsAt: { gt: fromUtc },
      },
    }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        startsAt: { lt: toUtc },
        endsAt: { gt: fromUtc },
      },
    }),
  ]);

  const slots: AvailableSlot[] = [];
  const now = new Date();

  // Iterate day by day using local noon to avoid DST edge anomalies
  const startParts = getLocalParts(fromUtc, timeZone);
  const endParts = getLocalParts(toUtc, timeZone);

  let curNoon = localToUtc(
    startParts.year,
    startParts.month,
    startParts.day,
    12,
    0,
    timeZone
  );

  const endNoon = localToUtc(
    endParts.year,
    endParts.month,
    endParts.day,
    12,
    0,
    timeZone
  );

  while (curNoon.getTime() <= endNoon.getTime() + 2 * 60 * 60 * 1000) {
    const local = getLocalParts(curNoon, timeZone);
    const dayOfWeek = local.dayOfWeek;

    // Schedules for this day of week
    const daySchedules = doctor.schedules.filter((s) => s.dayOfWeek === dayOfWeek);

    for (const schedule of daySchedules) {
      const { hours: startH, minutes: startM } = parseTimeString(schedule.startTime);
      const { hours: endH, minutes: endM } = parseTimeString(schedule.endTime);

      const scheduleStartMinutes = startH * 60 + startM;
      const scheduleEndMinutes = endH * 60 + endM;
      const duration = schedule.slotDurationMinutes;

      for (
        let slotM = scheduleStartMinutes;
        slotM + duration <= scheduleEndMinutes;
        slotM += duration
      ) {
        const slotHour = Math.floor(slotM / 60);
        const slotMinute = slotM % 60;

        const slotStartUtc = localToUtc(
          local.year,
          local.month,
          local.day,
          slotHour,
          slotMinute,
          timeZone
        );
        const slotEndUtc = new Date(slotStartUtc.getTime() + duration * 60 * 1000);

        // Disallow slots in the past
        if (slotStartUtc.getTime() <= now.getTime() + 15 * 60 * 1000) {
          continue;
        }

        // Check if outside query window
        if (slotStartUtc < fromUtc || slotEndUtc > toUtc) {
          continue;
        }

        // Check schedule exceptions
        const hasException = exceptions.some(
          (ex) => ex.startsAt < slotEndUtc && ex.endsAt > slotStartUtc
        );
        if (hasException) {
          continue;
        }

        // Check conflicting appointments
        const hasConflict = appointments.some(
          (apt) => apt.startsAt < slotEndUtc && apt.endsAt > slotStartUtc
        );
        if (hasConflict) {
          continue;
        }

        const hh = String(slotHour).padStart(2, "0");
        const mm = String(slotMinute).padStart(2, "0");

        slots.push({
          startsAt: slotStartUtc.toISOString(),
          endsAt: slotEndUtc.toISOString(),
          time: `${hh}:${mm}`,
          date: local.dateString,
        });
      }
    }

    // Advance 24 hours to next noon
    curNoon = new Date(curNoon.getTime() + 24 * 60 * 60 * 1000);
  }

  // Sort slots by startsAt ascending
  slots.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return slots;
}

export interface CreateAppointmentServiceInput {
  patientName: string;
  patientPhone: string;
  patientEmail?: string | null;
  doctorId: string;
  departmentId?: string | null;
  startsAt: string; // ISO UTC
  reasonForVisit?: string | null;
  createdByUserId?: string | null;
}

/**
 * Creates an appointment with server-side validation and concurrency-safe locking.
 */
export async function createAppointment(
  input: CreateAppointmentServiceInput
): Promise<{ referenceCode: string; status: AppointmentStatus }> {
  const reqStart = new Date(input.startsAt);
  if (isNaN(reqStart.getTime())) {
    throw new ValidationError("Invalid startsAt timestamp");
  }

  const now = new Date();
  if (reqStart.getTime() <= now.getTime()) {
    throw new ValidationError("Appointment time must be in the future");
  }

  // Fetch doctor and verify active
  const doctor = await prisma.doctor.findUnique({
    where: { id: input.doctorId },
    include: {
      schedules: { where: { isActive: true } },
    },
  });

  if (!doctor || !doctor.isActive) {
    throw new NotFoundError("Selected doctor does not exist or is inactive");
  }

  // Determine hospital local time components
  const local = getLocalParts(reqStart);
  const matchingSchedule = doctor.schedules.find(
    (s) => s.dayOfWeek === local.dayOfWeek
  );

  if (!matchingSchedule) {
    throw new ValidationError("Doctor is not scheduled to work on this day");
  }

  const duration = matchingSchedule.slotDurationMinutes;
  const reqEnd = new Date(reqStart.getTime() + duration * 60 * 1000);

  // Validate slot alignment with schedule hours
  const { hours: schStartH, minutes: schStartM } = parseTimeString(
    matchingSchedule.startTime
  );
  const { hours: schEndH, minutes: schEndM } = parseTimeString(
    matchingSchedule.endTime
  );

  const slotStartMins = local.hour * 60 + local.minute;
  const scheduleStartMins = schStartH * 60 + schStartM;
  const scheduleEndMins = schEndH * 60 + schEndM;

  if (
    slotStartMins < scheduleStartMins ||
    slotStartMins + duration > scheduleEndMins ||
    (slotStartMins - scheduleStartMins) % duration !== 0
  ) {
    throw new ValidationError(
      "Requested time does not align with the doctor's available schedule slot"
    );
  }

  // Check schedule exceptions
  const exception = await prisma.doctorScheduleException.findFirst({
    where: {
      doctorId: doctor.id,
      startsAt: { lt: reqEnd },
      endsAt: { gt: reqStart },
    },
  });

  if (exception) {
    throw new SlotConflictError(
      "Doctor is unavailable during this time due to scheduled leave"
    );
  }

  const referenceCode = generateReferenceCode();

  // Execute inside an isolated transaction with concurrency safety
  try {
    const newAppointment = await prisma.$transaction(
      async (tx) => {
        // 1. Release expired holds for this doctor
        await releaseExpiredPendingAppointments(tx, doctor.id);

        // 2. Concurrency check: find any overlapping blocking appointments
        const conflict = await tx.appointment.findFirst({
          where: {
            doctorId: doctor.id,
            status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
            startsAt: { lt: reqEnd },
            endsAt: { gt: reqStart },
          },
        });

        if (conflict) {
          throw new SlotConflictError();
        }

        // 3. Insert new appointment
        return tx.appointment.create({
          data: {
            referenceCode,
            patientName: input.patientName,
            patientPhone: input.patientPhone,
            patientEmail: input.patientEmail || null,
            doctorId: doctor.id,
            startsAt: reqStart,
            endsAt: reqEnd,
            status: AppointmentStatus.PENDING,
            reasonForVisit: input.reasonForVisit || null,
            createdByUserId: input.createdByUserId || null,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    // Asynchronously dispatch notification
    notificationService
      .sendBookingConfirmation({
        referenceCode: newAppointment.referenceCode,
        recipientEmail: newAppointment.patientEmail,
        recipientPhone: newAppointment.patientPhone,
        recipientName: newAppointment.patientName,
        doctorName: doctor.fullName,
        appointmentTime: `${local.dateString} ${local.timeString}`,
        status: newAppointment.status,
      })
      .catch((err) => console.error("Notification dispatch failed:", err));

    return {
      referenceCode: newAppointment.referenceCode,
      status: newAppointment.status,
    };
  } catch (error: unknown) {
    // If PostgreSQL raises exclusion constraint violation or transaction retry
    if (
      error &&
      typeof error === "object" &&
      (("code" in error && (error.code === "23P01" || error.code === "P2034")) ||
        ("message" in error &&
          typeof error.message === "string" &&
          (error.message.includes("no_overlapping_blocking_appointments") ||
            error.message.includes("could not serialize access") ||
            error.message.includes("write conflict"))))
    ) {
      throw new SlotConflictError();
    }
    throw error;
  }
}
