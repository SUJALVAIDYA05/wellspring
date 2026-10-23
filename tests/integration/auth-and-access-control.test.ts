import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import {
  createSessionToken,
  hashPassword,
  requireStaffSession,
  verifyPassword,
} from "@/lib/auth";
import { StaffRole } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";

describe("Staff Authentication and Role-Based Authorization Tests", () => {
  let adminUser: { id: string; email: string; name: string; role: StaffRole };
  let employeeUser: { id: string; email: string; name: string; role: StaffRole };
  let adminToken: string;
  let employeeToken: string;

  beforeAll(async () => {
    const pwHash = await hashPassword("TestPass123!");

    const admin = await prisma.staffUser.create({
      data: {
        name: "Test Admin",
        email: `admin-${Date.now()}@test.local`,
        passwordHash: pwHash,
        role: StaffRole.ADMIN,
        isActive: true,
      },
    });
    adminUser = { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
    adminToken = await createSessionToken(adminUser);

    const employee = await prisma.staffUser.create({
      data: {
        name: "Test Employee",
        email: `emp-${Date.now()}@test.local`,
        passwordHash: pwHash,
        role: StaffRole.EMPLOYEE,
        isActive: true,
      },
    });
    employeeUser = {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      role: employee.role,
    };
    employeeToken = await createSessionToken(employeeUser);
  });

  afterAll(async () => {
    await prisma.staffUser.deleteMany({
      where: { id: { in: [adminUser.id, employeeUser.id] } },
    });
  });

  it("hashes and verifies staff passwords securely", async () => {
    const hashed = await hashPassword("Secret12345");
    expect(hashed).not.toBe("Secret12345");
    expect(await verifyPassword("Secret12345", hashed)).toBe(true);
    expect(await verifyPassword("WrongPassword", hashed)).toBe(false);
  });

  it("blocks unauthenticated requests without session token", async () => {
    const req = new Request("http://localhost:3000/api/staff/appointments", {
      method: "GET",
    });

    await expect(requireStaffSession(req)).rejects.toThrow(UnauthorizedError);
  });

  it("blocks invalid/forged session tokens", async () => {
    const req = new Request("http://localhost:3000/api/staff/appointments", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid.fake.token",
      },
    });

    await expect(requireStaffSession(req)).rejects.toThrow(UnauthorizedError);
  });

  it("allows authenticated employee to access general staff endpoints", async () => {
    const req = new Request("http://localhost:3000/api/staff/appointments", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${employeeToken}`,
      },
    });

    const session = await requireStaffSession(req);
    expect(session.id).toBe(employeeUser.id);
    expect(session.role).toBe(StaffRole.EMPLOYEE);
  });

  it("CRITICAL RULE: Rejects EMPLOYEE access to ADMIN-only actions with 403 Forbidden", async () => {
    const req = new Request("http://localhost:3000/api/staff/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${employeeToken}`,
      },
    });

    // requireStaffSession with [StaffRole.ADMIN] must reject employees
    await expect(requireStaffSession(req, [StaffRole.ADMIN])).rejects.toThrow(
      ForbiddenError
    );
  });

  it("permits ADMIN to access ADMIN-only actions", async () => {
    const req = new Request("http://localhost:3000/api/staff/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const session = await requireStaffSession(req, [StaffRole.ADMIN]);
    expect(session.id).toBe(adminUser.id);
    expect(session.role).toBe(StaffRole.ADMIN);
  });
});
