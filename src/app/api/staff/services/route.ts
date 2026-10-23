import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth";
import {
  formatErrorResponse,
  successResponse,
  ValidationError,
} from "@/lib/errors";
import { createServiceSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import { StaffRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await requireStaffSession(request, [StaffRole.ADMIN]);
    const body = await request.json();
    const validated = createServiceSchema.parse(body);

    const existing = await prisma.service.findUnique({
      where: { slug: validated.slug },
    });
    if (existing) {
      throw new ValidationError(`Service slug '${validated.slug}' already exists`);
    }

    const service = await prisma.service.create({
      data: validated,
    });

    await recordAuditLog({
      actorUserId: session.id,
      action: "CREATE_SERVICE",
      entityType: "Service",
      entityId: service.id,
      metadata: { slug: service.slug, name: service.name },
    });

    return successResponse({ data: service }, 201);
  } catch (error) {
    return formatErrorResponse(error);
  }
}
