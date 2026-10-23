import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth";
import { formatErrorResponse, successResponse } from "@/lib/errors";
import { staffAppointmentsQuerySchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireStaffSession(request);

    const { searchParams } = new URL(request.url);
    const query = staffAppointmentsQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      doctorId: searchParams.get("doctorId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      referenceCode: searchParams.get("referenceCode") ?? undefined,
    });

    const where: Prisma.AppointmentWhereInput = {};

    if (query.doctorId) {
      where.doctorId = query.doctorId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.referenceCode) {
      where.referenceCode = {
        contains: query.referenceCode,
        mode: "insensitive",
      };
    }

    if (query.from || query.to) {
      where.startsAt = {};
      if (query.from) {
        where.startsAt.gte = new Date(query.from);
      }
      if (query.to) {
        where.startsAt.lte = new Date(query.to);
      }
    }

    const skip = (query.page - 1) * query.limit;

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip,
        take: query.limit,
        include: {
          doctor: {
            select: {
              id: true,
              fullName: true,
              specialty: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { startsAt: "asc" },
      }),
    ]);

    return successResponse({
      data: appointments,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
