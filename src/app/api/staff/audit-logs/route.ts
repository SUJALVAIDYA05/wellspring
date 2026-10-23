import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth";
import { formatErrorResponse, successResponse } from "@/lib/errors";
import { StaffRole, Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireStaffSession(request, [StaffRole.ADMIN]);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const actorUserId = searchParams.get("actorUserId");

    const where: Prisma.AuditLogWhereInput = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (actorUserId) where.actorUserId = actorUserId;

    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return successResponse({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
