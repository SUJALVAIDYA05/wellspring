import { formatErrorResponse, successResponse } from "@/lib/errors";
import { requireStaffSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await requireStaffSession(request);
    return successResponse({ user: session });
  } catch (error) {
    return formatErrorResponse(error);
  }
}
