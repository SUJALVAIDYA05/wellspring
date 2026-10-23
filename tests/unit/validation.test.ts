import { describe, it, expect } from "vitest";
import {
  createAppointmentSchema,
  staffLoginSchema,
  updateAppointmentSchema,
  availabilityQuerySchema,
} from "@/lib/validations";

describe("Input Validation Unit Tests", () => {
  describe("createAppointmentSchema", () => {
    const validAppointment = {
      patientName: "Jane Doe",
      patientPhone: "+1-555-0199",
      patientEmail: "jane.doe@example.com",
      doctorId: "a0000000-0000-4000-8000-000000000001",
      startsAt: "2026-11-20T14:00:00.000Z",
      reasonForVisit: "Annual general checkup",
    };

    it("accepts valid appointment input", () => {
      const parsed = createAppointmentSchema.safeParse(validAppointment);
      expect(parsed.success).toBe(true);
    });

    it("rejects short or empty patient name", () => {
      const parsed = createAppointmentSchema.safeParse({
        ...validAppointment,
        patientName: "J",
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toContain("at least 2 characters");
      }
    });

    it("rejects invalid phone number formats", () => {
      const parsed = createAppointmentSchema.safeParse({
        ...validAppointment,
        patientPhone: "abc",
      });
      expect(parsed.success).toBe(false);
    });

    it("accepts valid international phone number format", () => {
      const parsed = createAppointmentSchema.safeParse({
        ...validAppointment,
        patientPhone: "+44 20 7946 0991",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid email format", () => {
      const parsed = createAppointmentSchema.safeParse({
        ...validAppointment,
        patientEmail: "not-an-email",
      });
      expect(parsed.success).toBe(false);
    });

    it("allows optional empty email", () => {
      const parsed = createAppointmentSchema.safeParse({
        ...validAppointment,
        patientEmail: "",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects non-uuid doctorId", () => {
      const parsed = createAppointmentSchema.safeParse({
        ...validAppointment,
        doctorId: "invalid-doctor-id",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects non-ISO startsAt timestamp", () => {
      const parsed = createAppointmentSchema.safeParse({
        ...validAppointment,
        startsAt: "2026-11-20 09:00",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("staffLoginSchema", () => {
    it("accepts valid email and password", () => {
      const parsed = staffLoginSchema.safeParse({
        email: "staff@hospital.org",
        password: "securePassword123",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects short password", () => {
      const parsed = staffLoginSchema.safeParse({
        email: "staff@hospital.org",
        password: "123",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("availabilityQuerySchema", () => {
    it("validates from and to presence", () => {
      const valid = availabilityQuerySchema.safeParse({
        from: "2026-11-01",
        to: "2026-11-07",
      });
      expect(valid.success).toBe(true);

      const invalid = availabilityQuerySchema.safeParse({
        from: "2026-11-01",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("updateAppointmentSchema", () => {
    it("accepts valid status updates", () => {
      const valid = updateAppointmentSchema.safeParse({
        status: "CONFIRMED",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const invalid = updateAppointmentSchema.safeParse({
        status: "NOT_A_VALID_STATUS",
      });
      expect(invalid.success).toBe(false);
    });
  });
});
