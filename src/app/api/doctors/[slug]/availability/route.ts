import { prisma } from "@/lib/db";
import { formatErrorResponse, successResponse, NotFoundError } from "@/lib/errors";
import { getDoctorAvailableSlots } from "@/lib/services/appointment-service";
import { availabilityQuerySchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug?: string; id?: string }> }
) {
  try {
    const resolvedParams = await params;
    const identifier = resolvedParams.slug || resolvedParams.id;

    if (!identifier) {
      throw new NotFoundError("Doctor identifier is required");
    }

    const { searchParams } = new URL(request.url);

    const query = availabilityQuerySchema.parse({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    // Support both ID and slug identifier
    const doctor = await prisma.doctor.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
        isActive: true,
      },
      select: { id: true },
    });

    if (!doctor) {
      throw new NotFoundError("Doctor not found or currently inactive");
    }

    const slots = await getDoctorAvailableSlots(doctor.id, query.from, query.to);

    return successResponse({
      doctorId: doctor.id,
      slots,
      count: slots.length,
    });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
