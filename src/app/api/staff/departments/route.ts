import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth";
import {
  formatErrorResponse,
  successResponse,
  ValidationError,
} from "@/lib/errors";
import { createDepartmentSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import { StaffRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await requireStaffSession(request, [StaffRole.ADMIN]);
    const body = await request.json();
    const validated = createDepartmentSchema.parse(body);

    const existing = await prisma.department.findUnique({
      where: { slug: validated.slug },
    });
    if (existing) {
      throw new ValidationError(`Department slug '${validated.slug}' already exists`);
    }

    const department = await prisma.department.create({
      data: validated,
    });

    await recordAuditLog({
      actorUserId: session.id,
      action: "CREATE_DEPARTMENT",
      entityType: "Department",
      entityId: department.id,
      metadata: { slug: department.slug, name: department.name },
    });

    return successResponse({ data: department }, 201);
  } catch (error) {
    return formatErrorResponse(error);
  }
}
