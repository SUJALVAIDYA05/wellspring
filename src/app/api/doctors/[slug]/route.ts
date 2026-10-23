import { prisma } from "@/lib/db";
import { formatErrorResponse, successResponse, NotFoundError } from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string; id?: string }> }
) {
  try {
    const resolvedParams = await params;
    const identifier = resolvedParams.slug || resolvedParams.id;

    if (!identifier) {
      throw new NotFoundError("Doctor identifier is required");
    }

    const doctor = await prisma.doctor.findFirst({
      where: {
        OR: [{ slug: identifier }, { id: identifier }],
      },
      include: {
        department: {
          select: {
            id: true,
            slug: true,
            name: true,
            summary: true,
          },
        },
        schedules: {
          where: { isActive: true },
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            slotDurationMinutes: true,
          },
        },
      },
    });

    if (!doctor || !doctor.isActive) {
      throw new NotFoundError(`Doctor '${identifier}' not found`);
    }

    return successResponse({ data: doctor });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
