import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const SENSITIVE_KEYS = new Set([
  "patientname",
  "patientphone",
  "patientemail",
  "phone",
  "email",
  "password",
  "passwordhash",
  "reasonforvisit",
  "clinicalnotes",
  "notes",
]);

export function redactMetadata(data: unknown): Prisma.InputJsonValue {
  if (!data || typeof data !== "object") {
    return (data as Prisma.InputJsonValue) ?? null;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactMetadata(item)) as Prisma.InputJsonValue;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      result[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      result[key] = redactMetadata(value);
    } else {
      result[key] = value;
    }
  }

  return result as Prisma.InputJsonValue;
}

export interface RecordAuditLogParams {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function recordAuditLog({
  actorUserId,
  action,
  entityType,
  entityId,
  metadata,
}: RecordAuditLogParams) {
  try {
    const cleanMetadata = metadata ? redactMetadata(metadata) : Prisma.JsonNull;
    return await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        metadata: cleanMetadata,
      },
    });
  } catch (error) {
    // Audit log failure should be logged but not crash critical operational paths unless strict
    console.error("Failed to write audit log:", error);
    return null;
  }
}
