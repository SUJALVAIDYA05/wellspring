import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GET as getDepartments } from "@/app/api/departments/route";
import { GET as getDoctors } from "@/app/api/doctors/route";
import { GET as getDoctorBySlug } from "@/app/api/doctors/[slug]/route";
import { GET as getDoctorAvailability } from "@/app/api/doctors/[slug]/availability/route";
import { POST as postAppointment } from "@/app/api/appointments/route";
import { prisma } from "@/lib/db";
import { localToUtc } from "@/lib/timezone";

describe("Public Appointment Booking Flow End-to-End Tests", () => {
  let activeDoctor: { id: string; slug: string; fullName: string };
  let inactiveDoctor: { id: string; slug: string };
  let createdAppointmentRefs: string[] = [];

  beforeAll(async () => {
    // 1. Fetch active doctor from database
    const doctor = await prisma.doctor.findFirst({
      where: { slug: "dr-alex-carter", isActive: true },
    });
    if (!doctor) throw new Error("Seed doctor dr-alex-carter not found");
    activeDoctor = {
      id: doctor.id,
      slug: doctor.slug,
      fullName: doctor.fullName,
    };

    // 2. Fetch inactive doctor from database
    const inactive = await prisma.doctor.findFirst({
      where: { isActive: false },
    });
    if (!inactive) throw new Error("Inactive test doctor not found in seed");
    inactiveDoctor = {
      id: inactive.id,
      slug: inactive.slug,
    };

    // Clean up any test appointments from prior test runs on this slot
    await prisma.appointment.deleteMany({
      where: {
        doctorId: activeDoctor.id,
        startsAt: localToUtc(2026, 11, 23, 10, 0),
      },
    });
  });

  afterAll(async () => {
    // Clean up appointments created during this test
    if (createdAppointmentRefs.length > 0) {
      await prisma.appointment.deleteMany({
        where: { referenceCode: { in: createdAppointmentRefs } },
      });
    }
    if (activeDoctor?.id) {
      await prisma.appointment.deleteMany({
        where: {
          doctorId: activeDoctor.id,
          startsAt: localToUtc(2026, 11, 23, 10, 0),
        },
      });
    }
  });

  describe("1. Initial Data Loading (Departments & Doctors)", () => {
    it("loads active departments successfully", async () => {
      const res = await getDepartments();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
      const hasGeneralMed = json.data.some(
        (d: { slug: string }) => d.slug === "general-medicine"
      );
      expect(hasGeneralMed).toBe(true);
    });

    it("loads active doctors with department info and schedules", async () => {
      const res = await getDoctors(new Request("http://localhost:3000/api/doctors"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      // All returned doctors must be active
      expect(json.data.every((d: { isActive: boolean }) => d.isActive)).toBe(true);
      // Inactive doctor must NOT be in public list
      expect(json.data.some((d: { id: string }) => d.id === inactiveDoctor.id)).toBe(false);
    });
  });

  describe("2. Doctor Profile & Schedule Verification", () => {
    it("returns public profile and recurring schedule for active doctor", async () => {
      const res = await getDoctorBySlug(
        new Request(`http://localhost:3000/api/doctors/${activeDoctor.slug}`),
        { params: Promise.resolve({ slug: activeDoctor.slug }) }
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(activeDoctor.id);
      expect(json.data.fullName).toBe(activeDoctor.fullName);
      expect(Array.isArray(json.data.schedules)).toBe(true);
      expect(json.data.schedules.length).toBeGreaterThanOrEqual(1);
    });

    it("returns 404 for inactive doctor profile", async () => {
      const res = await getDoctorBySlug(
        new Request(`http://localhost:3000/api/doctors/${inactiveDoctor.slug}`),
        { params: Promise.resolve({ slug: inactiveDoctor.slug }) }
      );
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 for non-existent doctor slug", async () => {
      const res = await getDoctorBySlug(
        new Request("http://localhost:3000/api/doctors/non-existent-doctor-slug"),
        { params: Promise.resolve({ slug: "non-existent-doctor-slug" }) }
      );
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });
  });

  describe("3. Live Availability Slots Calculation", () => {
    it("calculates server-verified slots for a valid future working date", async () => {
      // Future Monday: 2026-11-23 (Dr. Carter works Mon-Fri 09:00 - 17:00, 30 min slots)
      const dateStr = "2026-11-23";
      const url = `http://localhost:3000/api/doctors/${activeDoctor.slug}/availability?from=${dateStr}&to=${dateStr}`;
      const res = await getDoctorAvailability(new Request(url), {
        params: Promise.resolve({ slug: activeDoctor.slug }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.doctorId).toBe(activeDoctor.id);
      expect(Array.isArray(json.slots)).toBe(true);
      expect(json.slots.length).toBeGreaterThan(0);

      // Verify slot shape
      const slot = json.slots[0];
      expect(slot).toHaveProperty("startsAt");
      expect(slot).toHaveProperty("endsAt");
      expect(slot).toHaveProperty("time");
      expect(slot).toHaveProperty("date");
      expect(slot.date).toBe(dateStr);
    });

    it("returns 0 slots on a non-working day (e.g. Sunday)", async () => {
      // Sunday: 2026-11-22
      const dateStr = "2026-11-22";
      const url = `http://localhost:3000/api/doctors/${activeDoctor.slug}/availability?from=${dateStr}&to=${dateStr}`;
      const res = await getDoctorAvailability(new Request(url), {
        params: Promise.resolve({ slug: activeDoctor.slug }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.slots).toHaveLength(0);
    });

    it("safely returns 404 when querying availability for inactive doctor", async () => {
      const url = `http://localhost:3000/api/doctors/${inactiveDoctor.slug}/availability?from=2026-11-23&to=2026-11-23`;
      const res = await getDoctorAvailability(new Request(url), {
        params: Promise.resolve({ slug: inactiveDoctor.slug }),
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });
  });

  describe("4. End-to-End Booking Submission & Concurrency Conflict", () => {
    // Test slot: 2026-11-23 at 10:00 AM local
    const bookingSlotUtc = localToUtc(2026, 11, 23, 10, 0);

    it("submits valid appointment and returns reference code and PENDING status", async () => {
      const payload = {
        patientName: "Jane Doe",
        patientPhone: "+1-555-0188",
        patientEmail: "jane.doe@example.com",
        doctorId: activeDoctor.id,
        startsAt: bookingSlotUtc.toISOString(),
        reasonForVisit: "New patient consultation",
      };

      const res = await postAppointment(
        new Request("http://localhost:3000/api/appointments", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.referenceCode).toMatch(/^APT-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(json.status).toBe("PENDING");

      createdAppointmentRefs.push(json.referenceCode);

      // Verify appointment in database
      const dbApt = await prisma.appointment.findUnique({
        where: { referenceCode: json.referenceCode },
      });
      expect(dbApt).toBeDefined();
      expect(dbApt?.patientName).toBe("Jane Doe");
      expect(dbApt?.doctorId).toBe(activeDoctor.id);
      expect(dbApt?.status).toBe("PENDING");
    });

    it("rejects booking the exact same slot with 409 DOCTOR_SLOT_UNAVAILABLE", async () => {
      const duplicatePayload = {
        patientName: "Second Patient",
        patientPhone: "+1-555-0199",
        patientEmail: "second@example.com",
        doctorId: activeDoctor.id,
        startsAt: bookingSlotUtc.toISOString(),
        reasonForVisit: "Attempting overlapping appointment",
      };

      const res = await postAppointment(
        new Request("http://localhost:3000/api/appointments", {
          method: "POST",
          body: JSON.stringify(duplicatePayload),
        })
      );

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error.code).toBe("DOCTOR_SLOT_UNAVAILABLE");
    });

    it("removes the booked slot from server availability list", async () => {
      const dateStr = "2026-11-23";
      const url = `http://localhost:3000/api/doctors/${activeDoctor.slug}/availability?from=${dateStr}&to=${dateStr}`;
      const res = await getDoctorAvailability(new Request(url), {
        params: Promise.resolve({ slug: activeDoctor.slug }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      const bookedTime = "10:00";
      const slotStillPresent = json.slots.some(
        (s: { time: string }) => s.time === bookedTime
      );
      expect(slotStillPresent).toBe(false);
    });
  });

  describe("5. Validation Errors & Bad Input Handling", () => {
    it("rejects appointment with short patient name (< 2 chars)", async () => {
      const slotStart = localToUtc(2026, 11, 23, 11, 0);
      const res = await postAppointment(
        new Request("http://localhost:3000/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            patientName: "J",
            patientPhone: "+1-555-0188",
            doctorId: activeDoctor.id,
            startsAt: slotStart.toISOString(),
          }),
        })
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects appointment with invalid phone number format", async () => {
      const slotStart = localToUtc(2026, 11, 23, 11, 0);
      const res = await postAppointment(
        new Request("http://localhost:3000/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            patientName: "Valid Patient",
            patientPhone: "not-a-phone-number",
            doctorId: activeDoctor.id,
            startsAt: slotStart.toISOString(),
          }),
        })
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects appointment scheduled in the past", async () => {
      const pastDate = new Date("2020-01-01T10:00:00Z");
      const res = await postAppointment(
        new Request("http://localhost:3000/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            patientName: "Valid Patient",
            patientPhone: "+1-555-0188",
            doctorId: activeDoctor.id,
            startsAt: pastDate.toISOString(),
          }),
        })
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.message).toContain("future");
    });

    it("rejects booking with an inactive doctor", async () => {
      const futureStart = localToUtc(2026, 11, 23, 11, 0);
      const res = await postAppointment(
        new Request("http://localhost:3000/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            patientName: "Valid Patient",
            patientPhone: "+1-555-0188",
            doctorId: inactiveDoctor.id,
            startsAt: futureStart.toISOString(),
          }),
        })
      );
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });
  });
});
