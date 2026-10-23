import { z } from "zod";
import { formatErrorResponse, successResponse } from "@/lib/errors";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email required"),
  phone: z.string().trim().max(25).optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Subject is required").max(200),
  message: z.string().trim().min(5, "Message must be at least 5 characters").max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = contactSchema.parse(body);

    // In production, persist contact message or forward to hospital communications email
    return successResponse(
      {
        success: true,
        message: "Your message has been received. Our team will contact you shortly.",
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    return formatErrorResponse(error);
  }
}
