import { prisma } from "@/lib/db";
import { hashPassword, requireStaffSession } from "@/lib/auth";
import {
  formatErrorResponse,
  successResponse,
  ValidationError,
} from "@/lib/errors";
import { createStaffUserSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import { StaffRole } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireStaffSession(request, [StaffRole.ADMIN]);

    const users = await prisma.staffUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });

    return successResponse({ data: users });
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireStaffSession(request, [StaffRole.ADMIN]);
    const body = await request.json();
    const validated = createStaffUserSchema.parse(body);

    const existing = await prisma.staffUser.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existing) {
      throw new ValidationError("A staff user with this email already exists");
    }

    const passwordHash = await hashPassword(validated.password);

    const user = await prisma.staffUser.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        role: validated.role,
        isActive: validated.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await recordAuditLog({
      actorUserId: session.id,
      action: "CREATE_STAFF_USER",
      entityType: "StaffUser",
      entityId: user.id,
      metadata: { role: user.role, email: user.email },
    });

    return successResponse({ data: user }, 201);
  } catch (error) {
    return formatErrorResponse(error);
  }
}
