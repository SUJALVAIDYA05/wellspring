"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStaffAuth } from "../StaffAuthContext";
import styles from "../staff.module.css";

export default function StaffAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useStaffAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className={styles.loadingBox}>
        <p>Verifying administrative credentials…</p>
      </div>
    );
  }

  // Unauthorized (not signed in)
  if (!user) {
    return (
      <div className={styles.forbiddenBox}>
        <h1 className={styles.forbiddenTitle}>Authentication Required</h1>
        <p className={styles.forbiddenText}>
          You must be signed in with an administrative staff account to view this section.
        </p>
        <Link href="/staff/login" className={styles.btnPrimary}>
          Sign In to Portal
        </Link>
      </div>
    );
  }

  // Forbidden (signed in as EMPLOYEE, but ADMIN required)
  if (user.role !== "ADMIN") {
    return (
      <div className={styles.forbiddenBox} role="alert">
        <h1 className={styles.forbiddenTitle} style={{ color: "var(--color-emergency)" }}>
          403 Forbidden
        </h1>
        <p className={styles.forbiddenText}>
          <strong>Access Denied:</strong> This administrative section is strictly restricted to
          users with the <strong>ADMIN</strong> role. Your account (
          <strong>{user.email}</strong>) has the <strong>EMPLOYEE</strong> role.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <Link href="/staff/appointments" className={styles.btnPrimary}>
            Return to Appointments Dashboard
          </Link>
          <Link href="/" className={styles.btnSecondary}>
            Public Website
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.adminTabs}>
        <Link
          href="/staff/admin/doctors"
          className={`${styles.adminTab} ${
            pathname.startsWith("/staff/admin/doctors") ? styles.adminTabActive : ""
          }`}
        >
          Doctors
        </Link>
        <Link
          href="/staff/admin/departments"
          className={`${styles.adminTab} ${
            pathname.startsWith("/staff/admin/departments") ? styles.adminTabActive : ""
          }`}
        >
          Departments
        </Link>
        <Link
          href="/staff/admin/services"
          className={`${styles.adminTab} ${
            pathname.startsWith("/staff/admin/services") ? styles.adminTabActive : ""
          }`}
        >
          Services
        </Link>
        <Link
          href="/staff/admin/users"
          className={`${styles.adminTab} ${
            pathname.startsWith("/staff/admin/users") ? styles.adminTabActive : ""
          }`}
        >
          Staff Accounts
        </Link>
        <Link
          href="/staff/admin/audit-logs"
          className={`${styles.adminTab} ${
            pathname.startsWith("/staff/admin/audit-logs") ? styles.adminTabActive : ""
          }`}
        >
          System Audit Logs
        </Link>
      </div>

      {children}
    </div>
  );
}
