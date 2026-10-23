import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, pool } from "@/lib/db";
import {
  createAppointment,
  getDoctorAvailableSlots,
} from "@/lib/services/appointment-service";
import { AppError } from "@/lib/errors";
import { localToUtc } from "@/lib/timezone";
import { AppointmentStatus } from "@prisma/client";

describe("Booking Concurrency and Database Constraint Integration Tests", () => {
  let testDepartmentId: string;
  let testDoctorId: string;
  let inactiveDoctorId: string;

  beforeAll(async () => {
    // Setup test department
    const dept = await prisma.department.create({
      data: {
        slug: `test-dept-booking-${Date.now()}`,
        name: "Test Dept for Concurrency",
        summary: "Summary for tests",
        description: "Description for tests",
        isActive: true,
      },
    });
    testDepartmentId = dept.id;

    // Active doctor with Monday schedule: 09:00 - 17:00, 30 min duration
    const doctor = await prisma.doctor.create({
      data: {
        slug: `dr-test-concurrency-${Date.now()}`,
        fullName: "Dr. Test Concurrency",
        specialty: "General Medicine",
        departmentId: testDepartmentId,
        qualifications: ["MD"],
        isActive: true,
        schedules: {
          create: [
            {
              dayOfWeek: 1, // Monday
              startTime: "09:00",
              endTime: "17:00",
              slotDurationMinutes: 30,
              isActive: true,
            },
          ],
        },
      },
    });
    testDoctorId = doctor.id;

    // Inactive doctor
    const inactiveDoctor = await prisma.doctor.create({
      data: {
        slug: `dr-inactive-${Date.now()}`,
        fullName: "Dr. Inactive Test",
        specialty: "Pathology",
        departmentId: testDepartmentId,
        qualifications: ["MD"],
        isActive: false,
      },
    });
    inactiveDoctorId = inactiveDoctor.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.appointment.deleteMany({
      where: { doctorId: { in: [testDoctorId, inactiveDoctorId] } },
    });
    await prisma.doctorScheduleException.deleteMany({
      where: { doctorId: testDoctorId },
    });
    await prisma.doctorSchedule.deleteMany({
      where: { doctorId: testDoctorId },
    });
    await prisma.doctor.deleteMany({
      where: { id: { in: [testDoctorId, inactiveDoctorId] } },
    });
    await prisma.department.deleteMany({
      where: { id: testDepartmentId },
    });
  });

  it("CRITICAL RULE: Prevents two concurrent requests from booking overlapping slots", async () => {
    // A future Monday at 10:00 AM hospital local time: 2026-11-23
    const slotStart = localToUtc(2026, 11, 23, 10, 0);

    const bookingInput1 = {
      patientName: "Patient One",
      patientPhone: "+1-555-0101",
      patientEmail: "p1@example.com",
      doctorId: testDoctorId,
      startsAt: slotStart.toISOString(),
    };

    const bookingInput2 = {
      patientName: "Patient Two",
      patientPhone: "+1-555-0102",
      patientEmail: "p2@example.com",
      doctorId: testDoctorId,
      startsAt: slotStart.toISOString(),
    };

    // Fire both requests concurrently in parallel
    const results = await Promise.allSettled([
      createAppointment(bookingInput1),
      createAppointment(bookingInput2),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly one must succeed and one must fail
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const error = (rejected[0] as PromiseRejectedResult).reason;
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("DOCTOR_SLOT_UNAVAILABLE");
  });

  it("permits adjacent slots where one slot ends exactly when the next begins", async () => {
    // Monday 2026-11-23 at 11:00 AM and 11:30 AM
    const slot1Start = localToUtc(2026, 11, 23, 11, 0);
    const slot2Start = localToUtc(2026, 11, 23, 11, 30);

    const res1 = await createAppointment({
      patientName: "Adjacent Patient 1",
      patientPhone: "+1-555-0201",
      doctorId: testDoctorId,
      startsAt: slot1Start.toISOString(),
    });

    const res2 = await createAppointment({
      patientName: "Adjacent Patient 2",
      patientPhone: "+1-555-0202",
      doctorId: testDoctorId,
      startsAt: slot2Start.toISOString(),
    });

    expect(res1.referenceCode).toMatch(/^APT-/);
    expect(res2.referenceCode).toMatch(/^APT-/);
  });

  it("releases slot for re-booking when an appointment is CANCELLED", async () => {
    // Monday 2026-11-23 at 14:00
    const slotStart = localToUtc(2026, 11, 23, 14, 0);

    const firstBooking = await createAppointment({
      patientName: "Original Patient",
      patientPhone: "+1-555-0301",
      doctorId: testDoctorId,
      startsAt: slotStart.toISOString(),
    });

    // Mark as CANCELLED
    await prisma.appointment.update({
      where: { referenceCode: firstBooking.referenceCode },
      data: { status: AppointmentStatus.CANCELLED, cancellationReason: "Patient request" },
    });

    // New booking for the same slot should now SUCCEED
    const secondBooking = await createAppointment({
      patientName: "New Patient After Cancellation",
      patientPhone: "+1-555-0302",
      doctorId: testDoctorId,
      startsAt: slotStart.toISOString(),
    });

    expect(secondBooking.referenceCode).toBeDefined();
    expect(secondBooking.referenceCode).not.toBe(firstBooking.referenceCode);
  });

  it("blocks booking during a scheduled doctor exception (leave/conference)", async () => {
    // Monday 2026-11-30: add an exception between 13:00 and 15:00
    const exStart = localToUtc(2026, 11, 30, 13, 0);
    const exEnd = localToUtc(2026, 11, 30, 15, 0);

    await prisma.doctorScheduleException.create({
      data: {
        doctorId: testDoctorId,
        startsAt: exStart,
        endsAt: exEnd,
        reason: "Medical Training",
      },
    });

    // Attempt booking during exception window: 13:30
    const attemptTime = localToUtc(2026, 11, 30, 13, 30);

    await expect(
      createAppointment({
        patientName: "Exception Test Patient",
        patientPhone: "+1-555-0401",
        doctorId: testDoctorId,
        startsAt: attemptTime.toISOString(),
      })
    ).rejects.toThrow();
  });

  it("rejects booking for inactive doctors", async () => {
    const slotStart = localToUtc(2026, 11, 23, 10, 0);

    await expect(
      createAppointment({
        patientName: "Inactive Doc Test",
        patientPhone: "+1-555-0501",
        doctorId: inactiveDoctorId,
        startsAt: slotStart.toISOString(),
      })
    ).rejects.toThrow();
  });

  it("calculates available slots accurately excluding blocked times", async () => {
    // Query availability for Monday 2026-11-23
    const slots = await getDoctorAvailableSlots(
      testDoctorId,
      "2026-11-23",
      "2026-11-23"
    );

    // Booked slots (10:00, 11:00, 11:30, 14:00) should not be available
    const slotTimes = slots.map((s) => s.time);
    expect(slotTimes).not.toContain("10:00");
    expect(slotTimes).not.toContain("11:00");
    expect(slotTimes).not.toContain("11:30");
    expect(slotTimes).not.toContain("14:00");

    // Free slots (e.g. 09:00, 09:30, 15:00) should be available
    expect(slotTimes).toContain("09:00");
    expect(slotTimes).toContain("09:30");
    expect(slotTimes).toContain("15:00");
  });
});
