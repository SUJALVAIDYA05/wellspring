import { formatErrorResponse, successResponse } from "@/lib/errors";
import { createAppointment } from "@/lib/services/appointment-service";
import { createAppointmentSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createAppointmentSchema.parse(body);

    const result = await createAppointment({
      patientName: validated.patientName,
      patientPhone: validated.patientPhone,
      patientEmail: validated.patientEmail || undefined,
      doctorId: validated.doctorId,
      departmentId: validated.departmentId || undefined,
      startsAt: validated.startsAt,
      reasonForVisit: validated.reasonForVisit || undefined,
    });

    return successResponse(result, 201);
  } catch (error) {
    return formatErrorResponse(error);
  }
}
