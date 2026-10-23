import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth";
import {
  formatErrorResponse,
  NotFoundError,
  successResponse,
} from "@/lib/errors";
import { updateServiceSchema } from "@/lib/validations";
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
    const validated = updateServiceSchema.parse(body);

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Service '${id}' not found`);
    }

    const updated = await prisma.service.update({
      where: { id },
      data: validated,
    });

    await recordAuditLog({
      actorUserId: session.id,
      action: "UPDATE_SERVICE",
      entityType: "Service",
      entityId: id,
      metadata: { updatedFields: Object.keys(validated) },
    });

    return successResponse({ data: updated });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
