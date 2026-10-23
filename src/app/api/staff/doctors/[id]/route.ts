import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth";
import {
  formatErrorResponse,
  NotFoundError,
  successResponse,
} from "@/lib/errors";
import { updateDoctorSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import { StaffRole } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaffSession(request, [StaffRole.ADMIN]);
    const { id } = await params;
    const body = await request.json();
    const validated = updateDoctorSchema.parse(body);

    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Doctor '${id}' not found`);
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: validated,
    });

    await recordAuditLog({
      actorUserId: session.id,
      action: "UPDATE_DOCTOR",
      entityType: "Doctor",
      entityId: doctor.id,
      metadata: { updatedFields: Object.keys(validated) },
    });

    return successResponse({ data: doctor });
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaffSession(request, [StaffRole.ADMIN]);
    const { id } = await params;

    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Doctor '${id}' not found`);
    }

    // Soft delete to protect appointment history
    const doctor = await prisma.doctor.update({
      where: { id },
      data: { isActive: false },
    });

    await recordAuditLog({
      actorUserId: session.id,
      action: "DEACTIVATE_DOCTOR",
      entityType: "Doctor",
      entityId: doctor.id,
    });

    return successResponse({
      data: doctor,
      message: "Doctor deactivated successfully",
    });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
