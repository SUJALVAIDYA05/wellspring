import { prisma } from "@/lib/db";
import { formatErrorResponse, successResponse } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const specialty = searchParams.get("specialty");

    const whereClause: Record<string, unknown> = {
      isActive: true,
    };

    if (department) {
      whereClause.department = {
        OR: [{ id: department }, { slug: department }],
      };
    }

    if (specialty) {
      whereClause.specialty = {
        contains: specialty,
        mode: "insensitive",
      };
    }

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
      include: {
        department: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
        schedules: {
          where: { isActive: true },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            slotDurationMinutes: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return successResponse({ data: doctors });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
