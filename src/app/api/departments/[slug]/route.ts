import { prisma } from "@/lib/db";
import { formatErrorResponse, successResponse, NotFoundError } from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const department = await prisma.department.findUnique({
      where: { slug },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
        doctors: {
          where: { isActive: true },
          select: {
            id: true,
            slug: true,
            fullName: true,
            specialty: true,
            qualifications: true,
            photoUrl: true,
          },
          orderBy: { fullName: "asc" },
        },
      },
    });

    if (!department || !department.isActive) {
      throw new NotFoundError(`Department '${slug}' not found`);
    }

    return successResponse({ data: department });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
