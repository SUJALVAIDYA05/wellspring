import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GET as getDepartments } from "@/app/api/departments/route";
import { GET as getDepartmentBySlug } from "@/app/api/departments/[slug]/route";
import { GET as getServices } from "@/app/api/services/route";
import { GET as getDoctors } from "@/app/api/doctors/route";
import { GET as getDoctorBySlug } from "@/app/api/doctors/[slug]/route";
import { GET as getDoctorAvailability } from "@/app/api/doctors/[slug]/availability/route";
import { POST as postAppointment } from "@/app/api/appointments/route";
import { POST as postContact } from "@/app/api/contact/route";
import { POST as staffLogin } from "@/app/api/staff/auth/login/route";
import { GET as staffMe } from "@/app/api/staff/auth/me/route";
import { GET as staffAppointments } from "@/app/api/staff/appointments/route";
import { GET as getStaffUsers, POST as postStaffUsers } from "@/app/api/staff/users/route";
import { GET as getAuditLogs } from "@/app/api/staff/audit-logs/route";
import { prisma } from "@/lib/db";
import { localToUtc } from "@/lib/timezone";

describe("API Route Handlers End-to-End Tests", () => {
  let adminToken: string;
  let employeeToken: string;
  let seededDoctor: { id: string; slug: string };
  let seededDepartment: { id: string; slug: string };

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
    const adminData = await adminLoginRes.json();
    adminToken = adminData.token;

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
    const empData = await empLoginRes.json();
    employeeToken = empData.token;

    // Find seeded doctor
    const doc = await prisma.doctor.findFirst({
      where: { slug: "dr-alex-carter" },
      include: { department: true },
    });
    if (!doc) throw new Error("Seed doctor dr-alex-carter not found");
    seededDoctor = { id: doc.id, slug: doc.slug };
    seededDepartment = { id: doc.department.id, slug: doc.department.slug };

    // Clean up any lingering test appointment from previous runs
    await prisma.appointment.deleteMany({
      where: { patientPhone: "+1-555-8888" },
    });
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({
      where: { patientPhone: "+1-555-8888" },
    });
  });

  describe("Public Endpoints", () => {
    it("GET /api/departments returns active departments", async () => {
      const res = await getDepartments();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
      expect(json.data[0]).toHaveProperty("slug");
    });

    it("GET /api/departments/[slug] returns department detail and its services", async () => {
      const res = await getDepartmentBySlug(
        new Request(`http://localhost:3000/api/departments/${seededDepartment.slug}`),
        { params: Promise.resolve({ slug: seededDepartment.slug }) }
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.slug).toBe(seededDepartment.slug);
      expect(Array.isArray(json.data.services)).toBe(true);
    });

    it("GET /api/services returns active services", async () => {
      const res = await getServices(new Request("http://localhost:3000/api/services"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
    });

    it("GET /api/doctors returns active doctors", async () => {
      const res = await getDoctors(new Request("http://localhost:3000/api/doctors"));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.some((d: any) => d.slug === seededDoctor.slug)).toBe(true);
    });

    it("GET /api/doctors/[slug] returns public doctor profile", async () => {
      const res = await getDoctorBySlug(
        new Request(`http://localhost:3000/api/doctors/${seededDoctor.slug}`),
        { params: Promise.resolve({ slug: seededDoctor.slug }) }
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.fullName).toContain("Alex Carter");
      expect(Array.isArray(json.data.schedules)).toBe(true);
    });

    it("GET /api/doctors/[id]/availability returns available slots", async () => {
      const url = `http://localhost:3000/api/doctors/${seededDoctor.id}/availability?from=2026-11-23&to=2026-11-27`;
      const res = await getDoctorAvailability(new Request(url), {
        params: Promise.resolve({ id: seededDoctor.id }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.doctorId).toBe(seededDoctor.id);
      expect(Array.isArray(json.slots)).toBe(true);
      expect(json.count).toBeGreaterThan(0);
    });

    it("POST /api/appointments creates appointment and returns referenceCode", async () => {
      // Future Monday: 2026-11-23 at 15:30
      const start = localToUtc(2026, 11, 23, 15, 30);
      const res = await postAppointment(
        new Request("http://localhost:3000/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            patientName: "Public Booking Test",
            patientPhone: "+1-555-8888",
            patientEmail: "public@example.com",
            doctorId: seededDoctor.id,
            startsAt: start.toISOString(),
            reasonForVisit: "Public API test consultation",
          }),
        })
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.referenceCode).toMatch(/^APT-/);
      expect(json.status).toBe("PENDING");

      // Verify patient contact details are NOT leaked in public booking response
      expect(json).not.toHaveProperty("patientPhone");
      expect(json).not.toHaveProperty("patientEmail");
    });

    it("POST /api/contact validates and accepts contact message", async () => {
      const res = await postContact(
        new Request("http://localhost:3000/api/contact", {
          method: "POST",
          body: JSON.stringify({
            name: "Inquiring Visitor",
            email: "visitor@example.com",
            phone: "+1-555-7777",
            subject: "Hours inquiry",
            message: "What are your outpatient visiting hours?",
          }),
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe("Staff Protected Endpoints", () => {
    it("GET /api/staff/auth/me returns authenticated staff info", async () => {
      const res = await staffMe(
        new Request("http://localhost:3000/api/staff/auth/me", {
          headers: { Authorization: `Bearer ${employeeToken}` },
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.user.email).toBe("staff@fictional-wellspring.local");
      expect(json.user.role).toBe("EMPLOYEE");
    });

    it("GET /api/staff/appointments lists appointments with pagination for staff", async () => {
      const res = await staffAppointments(
        new Request("http://localhost:3000/api/staff/appointments?page=1&limit=10", {
          headers: { Authorization: `Bearer ${employeeToken}` },
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.pagination).toBeDefined();
      expect(json.pagination.page).toBe(1);
    });

    it("EMPLOYEE cannot access admin-only GET /api/staff/users", async () => {
      const res = await getStaffUsers(
        new Request("http://localhost:3000/api/staff/users", {
          headers: { Authorization: `Bearer ${employeeToken}` },
        })
      );
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("ADMIN can access GET /api/staff/users", async () => {
      const res = await getStaffUsers(
        new Request("http://localhost:3000/api/staff/users", {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
    });

    it("ADMIN can create a new staff user via POST /api/staff/users", async () => {
      const newEmail = `new-emp-${Date.now()}@fictional.local`;
      const res = await postStaffUsers(
        new Request("http://localhost:3000/api/staff/users", {
          method: "POST",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({
            name: "Newly Created Staff",
            email: newEmail,
            password: "SecurePassword123!",
            role: "EMPLOYEE",
            isActive: true,
          }),
        })
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.email).toBe(newEmail);
      expect(json.data).not.toHaveProperty("passwordHash");
    });

    it("ADMIN can view audit logs via GET /api/staff/audit-logs", async () => {
      const res = await getAuditLogs(
        new Request("http://localhost:3000/api/staff/audit-logs?limit=5", {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.pagination).toBeDefined();
    });
  });
});
