import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth";
import {
  formatErrorResponse,
  NotFoundError,
  successResponse,
} from "@/lib/errors";
import { cancelAppointmentSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import { notificationService } from "@/lib/notifications";
import { AppointmentStatus } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaffSession(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validated = cancelAppointmentSchema.parse(body);

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!existing) {
      throw new NotFoundError(`Appointment '${id}' not found`);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: validated.reason || "Staff initiated cancellation",
        updatedByUserId: session.id,
      },
    });

    await recordAuditLog({
      actorUserId: session.id,
      action: "CANCEL_APPOINTMENT",
      entityType: "Appointment",
      entityId: id,
      metadata: {
        reason: validated.reason,
      },
    });

    notificationService.sendCancellationNotice({
      referenceCode: updated.referenceCode,
      recipientEmail: updated.patientEmail,
      recipientPhone: updated.patientPhone,
      recipientName: updated.patientName,
      doctorName: existing.doctor.fullName,
      appointmentTime: updated.startsAt.toISOString(),
      status: updated.status,
    }).catch((e) => console.error("Notification error:", e));

    return successResponse({ data: updated });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
