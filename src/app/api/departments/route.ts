import { prisma } from "@/lib/db";
import { formatErrorResponse, successResponse } from "@/lib/errors";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            doctors: { where: { isActive: true } },
            services: { where: { isActive: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return successResponse({ data: departments });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
