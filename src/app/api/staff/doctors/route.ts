import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth";
import {
  formatErrorResponse,
  successResponse,
  ValidationError,
} from "@/lib/errors";
import { createDoctorSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import { StaffRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await requireStaffSession(request, [StaffRole.ADMIN]);
    const body = await request.json();
    const validated = createDoctorSchema.parse(body);

    const existingSlug = await prisma.doctor.findUnique({
      where: { slug: validated.slug },
    });
    if (existingSlug) {
      throw new ValidationError(`Doctor slug '${validated.slug}' is already in use`);
    }

    const doctor = await prisma.doctor.create({
      data: {
        slug: validated.slug,
        fullName: validated.fullName,
        specialty: validated.specialty,
        departmentId: validated.departmentId,
        qualifications: validated.qualifications,
        biography: validated.biography,
        photoUrl: validated.photoUrl,
        isActive: validated.isActive,
      },
    });

    await recordAuditLog({
      actorUserId: session.id,
      action: "CREATE_DOCTOR",
      entityType: "Doctor",
      entityId: doctor.id,
      metadata: { slug: doctor.slug, fullName: doctor.fullName },
    });

    return successResponse({ data: doctor }, 201);
  } catch (error) {
    return formatErrorResponse(error);
  }
}
