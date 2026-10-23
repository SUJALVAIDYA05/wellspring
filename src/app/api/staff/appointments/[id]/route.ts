import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth";
import {
  formatErrorResponse,
  NotFoundError,
  SlotConflictError,
  successResponse,
  ValidationError,
} from "@/lib/errors";
import { updateAppointmentSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import { notificationService } from "@/lib/notifications";
import { AppointmentStatus, Prisma } from "@prisma/client";
import { getLocalParts, parseTimeString } from "@/lib/timezone";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaffSession(request);
    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            department: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundError(`Appointment '${id}' not found`);
    }

    return successResponse({ data: appointment });
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaffSession(request);
    const { id } = await params;
    const body = await request.json();
    const validated = updateAppointmentSchema.parse(body);

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!existing) {
      throw new NotFoundError(`Appointment '${id}' not found`);
    }

    let startsAt = existing.startsAt;
    let endsAt = existing.endsAt;
    let doctorId = existing.doctorId;

    // Handle Rescheduling
    if (validated.startsAt || validated.doctorId) {
      const targetDoctorId = validated.doctorId || existing.doctorId;
      const targetStart = validated.startsAt
        ? new Date(validated.startsAt)
        : existing.startsAt;

      const doctor = await prisma.doctor.findUnique({
        where: { id: targetDoctorId },
        include: { schedules: { where: { isActive: true } } },
      });

      if (!doctor || !doctor.isActive) {
        throw new ValidationError("Target doctor does not exist or is inactive");
      }

      const local = getLocalParts(targetStart);
      const schedule = doctor.schedules.find((s) => s.dayOfWeek === local.dayOfWeek);
      if (!schedule) {
        throw new ValidationError("Doctor is not scheduled to work on this day");
      }

      const duration = schedule.slotDurationMinutes;
      const targetEnd = new Date(targetStart.getTime() + duration * 60 * 1000);

      const { hours: schStartH, minutes: schStartM } = parseTimeString(schedule.startTime);
      const { hours: schEndH, minutes: schEndM } = parseTimeString(schedule.endTime);
      const slotStartMins = local.hour * 60 + local.minute;
      const schStartMins = schStartH * 60 + schStartM;
      const schEndMins = schEndH * 60 + schEndM;

      if (
        slotStartMins < schStartMins ||
        slotStartMins + duration > schEndMins ||
        (slotStartMins - schStartMins) % duration !== 0
      ) {
        throw new ValidationError("Requested slot does not align with schedule");
      }

      // Check exceptions
      const exception = await prisma.doctorScheduleException.findFirst({
        where: {
          doctorId: targetDoctorId,
          startsAt: { lt: targetEnd },
          endsAt: { gt: targetStart },
        },
      });

      if (exception) {
        throw new SlotConflictError(
          "Doctor is unavailable due to scheduled exception"
        );
      }

      startsAt = targetStart;
      endsAt = targetEnd;
      doctorId = targetDoctorId;
    }

    const updated = await prisma.$transaction(
      async (tx) => {
        // If rescheduling or changing status to blocking, check conflict excluding this record
        const isBlocking =
          (validated.status || existing.status) === AppointmentStatus.PENDING ||
          (validated.status || existing.status) === AppointmentStatus.CONFIRMED;

        if (isBlocking && (validated.startsAt || validated.doctorId)) {
          const conflict = await tx.appointment.findFirst({
            where: {
              id: { not: existing.id },
              doctorId,
              status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
              startsAt: { lt: endsAt },
              endsAt: { gt: startsAt },
            },
          });

          if (conflict) {
            throw new SlotConflictError();
          }
        }

        return tx.appointment.update({
          where: { id },
          data: {
            ...(validated.status ? { status: validated.status } : {}),
            ...(validated.cancellationReason !== undefined
              ? { cancellationReason: validated.cancellationReason }
              : {}),
            startsAt,
            endsAt,
            doctorId,
            updatedByUserId: session.id,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    // Record audit log
    await recordAuditLog({
      actorUserId: session.id,
      action: "UPDATE_APPOINTMENT",
      entityType: "Appointment",
      entityId: id,
      metadata: {
        previousStatus: existing.status,
        newStatus: updated.status,
        rescheduled: Boolean(validated.startsAt || validated.doctorId),
        cancellationReason: validated.cancellationReason,
      },
    });

    // Send notifications if cancelled
    if (
      updated.status === AppointmentStatus.CANCELLED &&
      existing.status !== AppointmentStatus.CANCELLED
    ) {
      notificationService.sendCancellationNotice({
        referenceCode: updated.referenceCode,
        recipientEmail: updated.patientEmail,
        recipientPhone: updated.patientPhone,
        recipientName: updated.patientName,
        doctorName: existing.doctor.fullName,
        appointmentTime: updated.startsAt.toISOString(),
        status: updated.status,
      }).catch((e) => console.error("Cancellation notice error:", e));
    }

    return successResponse({ data: updated });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      (("code" in error && error.code === "23P01") ||
        ("message" in error &&
          typeof error.message === "string" &&
          error.message.includes("no_overlapping_blocking_appointments")))
    ) {
      return formatErrorResponse(new SlotConflictError());
    }
    return formatErrorResponse(error);
  }
}
