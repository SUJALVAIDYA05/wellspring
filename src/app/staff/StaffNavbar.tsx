"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStaffAuth } from "./StaffAuthContext";
import styles from "./staff.module.css";

export function StaffNavbar() {
  const { user, logout } = useStaffAuth();
  const pathname = usePathname();

  if (!user || pathname === "/staff/login") {
    return null;
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={brandGroupClass}>
          <Link href="/staff/appointments" className={styles.brandLink}>
            Wellspring Clinical
          </Link>
          <span className={styles.portalBadge}>Staff Portal</span>
        </div>

        <nav aria-label="Staff Portal Navigation">
          <ul className={styles.navLinks}>
            <li>
              <Link
                href="/staff/appointments"
                className={`${styles.navLink} ${
                  pathname.startsWith("/staff/appointments") ? styles.navLinkActive : ""
                }`}
              >
                Appointments
              </Link>
            </li>

            {isAdmin && (
              <>
                <li>
                  <Link
                    href="/staff/admin/doctors"
                    className={`${styles.navLink} ${
                      pathname.startsWith("/staff/admin/doctors") ? styles.navLinkActive : ""
                    }`}
                  >
                    Doctors
                  </Link>
                </li>
                <li>
                  <Link
                    href="/staff/admin/departments"
                    className={`${styles.navLink} ${
                      pathname.startsWith("/staff/admin/departments")
                        ? styles.navLinkActive
                        : ""
                    }`}
                  >
                    Departments
                  </Link>
                </li>
                <li>
                  <Link
                    href="/staff/admin/services"
                    className={`${styles.navLink} ${
                      pathname.startsWith("/staff/admin/services")
                        ? styles.navLinkActive
                        : ""
                    }`}
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/staff/admin/users"
                    className={`${styles.navLink} ${
                      pathname.startsWith("/staff/admin/users") ? styles.navLinkActive : ""
                    }`}
                  >
                    Staff Users
                  </Link>
                </li>
                <li>
                  <Link
                    href="/staff/admin/audit-logs"
                    className={`${styles.navLink} ${
                      pathname.startsWith("/staff/admin/audit-logs")
                        ? styles.navLinkActive
                        : ""
                    }`}
                  >
                    Audit Logs
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        <div className={styles.userControls}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userRoleBadge}>{user.role}</span>
          </div>
          <button onClick={logout} className={styles.btnSignOut} type="button">
            Sign Out
          </button>
          <Link href="/" className={styles.navLink} title="Return to public hospital website">
            Public Site ↗
          </Link>
        </div>
      </div>
    </header>
  );
}

const brandGroupClass = styles.brandGroup;
