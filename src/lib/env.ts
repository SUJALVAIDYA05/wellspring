import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters long"),
  HOSPITAL_TIMEZONE: z.string().default("America/New_York"),
  PENDING_SLOT_HOLD_MINUTES: z.coerce.number().int().positive().default(15),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export const env = {
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/wellspring?schema=public",
  AUTH_SECRET:
    process.env.AUTH_SECRET ||
    "dev-auth-secret-for-wellspring-hospital-portal-min32chars",
  HOSPITAL_TIMEZONE: process.env.HOSPITAL_TIMEZONE || "America/New_York",
  PENDING_SLOT_HOLD_MINUTES:
    Number(process.env.PENDING_SLOT_HOLD_MINUTES) || 15,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.warn(
      "Environment validation warning:",
      result.error.flatten().fieldErrors
    );
  }
  return result;
}
