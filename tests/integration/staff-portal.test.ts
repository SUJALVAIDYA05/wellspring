import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST as staffLogin } from "@/app/api/staff/auth/login/route";
import { GET as staffMe } from "@/app/api/staff/auth/me/route";
import { GET as getAppointments } from "@/app/api/staff/appointments/route";
import {
  GET as getAppointmentDetail,
  PATCH as patchAppointment,
} from "@/app/api/staff/appointments/[id]/route";
import { POST as cancelAppointment } from "@/app/api/staff/appointments/[id]/cancel/route";
import { GET as getStaffUsers, POST as postStaffUsers } from "@/app/api/staff/users/route";
import { GET as getAuditLogs } from "@/app/api/staff/audit-logs/route";
import { prisma } from "@/lib/db";
import { localToUtc } from "@/lib/timezone";
import { AppointmentStatus } from "@prisma/client";

describe("Protected Staff Portal Integration & Access Control Tests", () => {
  let employeeToken: string;
  let adminToken: string;
  let testDoctor: { id: string; slug: string };
  let testAppointment: { id: string; referenceCode: string };
  let conflictAppointment: { id: string; referenceCode: string; startsAt: Date };

  beforeAll(async () => {
    // 1. Authenticate dev admin from seed
    const adminLoginRes = await staffLogin(
      new Request("http://localhost:3000/api/staff/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "admin@fictional-wellspring.local",
          password: "Admin1234!",
        }),
      })
    );
    expect(adminLoginRes.status).toBe(200);
    const adminJson = await adminLoginRes.json();
    adminToken = adminJson.token;

    // 2. Authenticate dev employee from seed
    const empLoginRes = await staffLogin(
      new Request("http://localhost:3000/api/staff/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "staff@fictional-wellspring.local",
          password: "Staff1234!",
        }),
      })
    );
    expect(empLoginRes.status).toBe(200);
    const empJson = await empLoginRes.json();
    employeeToken = empJson.token;

    // 3. Find active doctor
    const doc = await prisma.doctor.findFirst({
      where: { slug: "dr-alex-carter", isActive: true },
    });
    if (!doc) throw new Error("Seed doctor dr-alex-carter not found");
    testDoctor = { id: doc.id, slug: doc.slug };

    // 4. Create sample test appointments
    const aptStart = localToUtc(2026, 12, 1, 14, 0);
    const aptEnd = localToUtc(2026, 12, 1, 14, 30);
    const apt = await prisma.appointment.create({
      data: {
        referenceCode: `APT-STAFF-${Date.now().toString().slice(-4)}`,
        patientName: "Portal Test Patient",
        patientPhone: "+1-555-0144",
        patientEmail: "portal.patient@example.com",
        doctorId: testDoctor.id,
        startsAt: aptStart,
        endsAt: aptEnd,
        status: AppointmentStatus.PENDING,
        reasonForVisit: "Staff portal management testing",
      },
    });
    testAppointment = { id: apt.id, referenceCode: apt.referenceCode };

    // Existing booked slot for reschedule conflict test
    const confStart = localToUtc(2026, 12, 1, 15, 0);
    const confEnd = localToUtc(2026, 12, 1, 15, 30);
    const confApt = await prisma.appointment.create({
      data: {
        referenceCode: `APT-CONF-${Date.now().toString().slice(-4)}`,
        patientName: "Blocking Patient",
        patientPhone: "+1-555-0155",
        doctorId: testDoctor.id,
        startsAt: confStart,
        endsAt: confEnd,
        status: AppointmentStatus.CONFIRMED,
      },
    });
    conflictAppointment = {
      id: confApt.id,
      referenceCode: confApt.referenceCode,
      startsAt: confStart,
    };
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({
      where: {
        id: { in: [testAppointment.id, conflictAppointment.id] },
      },
    });
  });

  describe("1. Unauthenticated Security Boundaries", () => {
    it("rejects unauthenticated requests to GET /api/staff/auth/me with 401", async () => {
      const res = await staffMe(new Request("http://localhost:3000/api/staff/auth/me"));
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects unauthenticated requests to GET /api/staff/appointments with 401", async () => {
      const res = await getAppointments(
        new Request("http://localhost:3000/api/staff/appointments")
      );
      expect(res.status).toBe(401);
    });

    it("rejects invalid staff credentials with 401", async () => {
      const res = await staffLogin(
        new Request("http://localhost:3000/api/staff/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: "admin@fictional-wellspring.local",
            password: "WrongPassword123!",
          }),
        })
      );
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("2. Role-Based Permissions (EMPLOYEE vs ADMIN)", () => {
    it("allows EMPLOYEE to list and filter appointments", async () => {
      const res = await getAppointments(
        new Request(
          `http://localhost:3000/api/staff/appointments?referenceCode=${testAppointment.referenceCode}`,
          {
            headers: { Authorization: `Bearer ${employeeToken}` },
          }
        )
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0].referenceCode).toBe(testAppointment.referenceCode);
    });

    it("strictly blocks EMPLOYEE from accessing admin-only GET /api/staff/users with 403", async () => {
      const res = await getStaffUsers(
        new Request("http://localhost:3000/api/staff/users", {
          headers: { Authorization: `Bearer ${employeeToken}` },
        })
      );
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("strictly blocks EMPLOYEE from accessing admin-only GET /api/staff/audit-logs with 403", async () => {
      const res = await getAuditLogs(
        new Request("http://localhost:3000/api/staff/audit-logs", {
          headers: { Authorization: `Bearer ${employeeToken}` },
        })
      );
      expect(res.status).toBe(403);
    });

    it("allows ADMIN to access staff user management", async () => {
      const res = await getStaffUsers(
        new Request("http://localhost:3000/api/staff/users", {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
    });
  });

  describe("3. Appointment Detail and Status Management", () => {
    it("allows staff to view complete appointment details", async () => {
      const res = await getAppointmentDetail(
        new Request(`http://localhost:3000/api/staff/appointments/${testAppointment.id}`, {
          headers: { Authorization: `Bearer ${employeeToken}` },
        }),
        { params: Promise.resolve({ id: testAppointment.id }) }
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.referenceCode).toBe(testAppointment.referenceCode);
      expect(json.data.patientName).toBe("Portal Test Patient");
      expect(json.data.patientPhone).toBe("+1-555-0144");
    });

    it("allows staff to update status to CONFIRMED", async () => {
      const res = await patchAppointment(
        new Request(`http://localhost:3000/api/staff/appointments/${testAppointment.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${employeeToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "CONFIRMED" }),
        }),
        { params: Promise.resolve({ id: testAppointment.id }) }
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe("CONFIRMED");

      // Verify audit log recorded
      const log = await prisma.auditLog.findFirst({
        where: {
          action: "UPDATE_APPOINTMENT",
          entityId: testAppointment.id,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(log).toBeDefined();
    });

    it("rejects rescheduling to a slot with a conflict (HTTP 409)", async () => {
      const res = await patchAppointment(
        new Request(`http://localhost:3000/api/staff/appointments/${testAppointment.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${employeeToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startsAt: conflictAppointment.startsAt.toISOString(),
          }),
        }),
        { params: Promise.resolve({ id: testAppointment.id }) }
      );
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error.code).toBe("DOCTOR_SLOT_UNAVAILABLE");
    });

    it("allows staff to cancel an appointment via POST .../cancel and records reason", async () => {
      const res = await cancelAppointment(
        new Request(`http://localhost:3000/api/staff/appointments/${testAppointment.id}/cancel`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${employeeToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: "Patient rescheduled via phone" }),
        }),
        { params: Promise.resolve({ id: testAppointment.id }) }
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe("CANCELLED");
      expect(json.data.cancellationReason).toBe("Patient rescheduled via phone");

      // Verify audit log
      const cancelLog = await prisma.auditLog.findFirst({
        where: {
          action: "CANCEL_APPOINTMENT",
          entityId: testAppointment.id,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(cancelLog).toBeDefined();
    });
  });
});
