import { prisma } from "@/lib/db";
import { hashPassword, requireStaffSession } from "@/lib/auth";
import {
  formatErrorResponse,
  NotFoundError,
  successResponse,
} from "@/lib/errors";
import { updateStaffUserSchema } from "@/lib/validations";
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
    const validated = updateStaffUserSchema.parse(body);

    const existing = await prisma.staffUser.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Staff user '${id}' not found`);
    }

    const data: Record<string, unknown> = {};
    if (validated.name !== undefined) data.name = validated.name;
    if (validated.email !== undefined) data.email = validated.email.toLowerCase();
    if (validated.role !== undefined) data.role = validated.role;
    if (validated.isActive !== undefined) data.isActive = validated.isActive;
    if (validated.password) {
      data.passwordHash = await hashPassword(validated.password);
    }

    const updated = await prisma.staffUser.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await recordAuditLog({
      actorUserId: session.id,
      action: "UPDATE_STAFF_USER",
      entityType: "StaffUser",
      entityId: id,
      metadata: {
        updatedFields: Object.keys(data).filter((k) => k !== "passwordHash"),
      },
    });

    return successResponse({ data: updated });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
