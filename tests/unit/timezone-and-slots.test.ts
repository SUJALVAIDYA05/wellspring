import { describe, it, expect } from "vitest";
import {
  localToUtc,
  getLocalParts,
  parseTimeString,
} from "@/lib/timezone";
import { redactMetadata } from "@/lib/audit";

describe("Timezone and Slot Calculations", () => {
  it("converts hospital timezone wall-clock time accurately in EDT (summer)", () => {
    // 2026-06-15 09:00 EDT (UTC-4) -> 2026-06-15 13:00 UTC
    const utcDate = localToUtc(2026, 6, 15, 9, 0, "America/New_York");
    expect(utcDate.toISOString()).toBe("2026-06-15T13:00:00.000Z");
  });

  it("converts hospital timezone wall-clock time accurately in EST (winter)", () => {
    // 2026-12-15 09:00 EST (UTC-5) -> 2026-12-15 14:00 UTC
    const utcDate = localToUtc(2026, 12, 15, 9, 0, "America/New_York");
    expect(utcDate.toISOString()).toBe("2026-12-15T14:00:00.000Z");
  });

  it("extracts correct local components from UTC date", () => {
    // 2026-10-21 13:30 UTC -> 09:30 EDT in America/New_York
    const utcDate = new Date("2026-10-21T13:30:00Z");
    const local = getLocalParts(utcDate, "America/New_York");

    expect(local.dateString).toBe("2026-10-21");
    expect(local.timeString).toBe("09:30");
    expect(local.hour).toBe(9);
    expect(local.minute).toBe(30);
    expect(local.dayOfWeek).toBe(3); // Wednesday
  });

  it("parses time strings correctly", () => {
    expect(parseTimeString("09:30")).toEqual({ hours: 9, minutes: 30 });
    expect(parseTimeString("17:00")).toEqual({ hours: 17, minutes: 0 });
  });

  it("redacts sensitive patient fields from audit log metadata", () => {
    const raw = {
      patientName: "John Private",
      patientPhone: "+1-555-9999",
      patientEmail: "john@confidential.org",
      password: "secretPassword",
      actionTaken: "RESCHEDULE_CONFIRMED",
      nonSensitiveField: 42,
    };

    const redacted = redactMetadata(raw) as Record<string, unknown>;
    expect(redacted.patientName).toBe("[REDACTED]");
    expect(redacted.patientPhone).toBe("[REDACTED]");
    expect(redacted.patientEmail).toBe("[REDACTED]");
    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.actionTaken).toBe("RESCHEDULE_CONFIRMED");
    expect(redacted.nonSensitiveField).toBe(42);
  });
});
