import { prisma } from "@/lib/db";
import { formatErrorResponse, successResponse } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
        department: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return successResponse({ data: services });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
