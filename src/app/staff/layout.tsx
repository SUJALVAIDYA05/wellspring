import React, { Suspense } from "react";
import type { Metadata } from "next";
import { StaffAuthProvider } from "./StaffAuthContext";
import { StaffNavbar } from "./StaffNavbar";
import styles from "./staff.module.css";

export const instant = false;

export const metadata: Metadata = {
  title: "Hospital Staff Portal | Wellspring",
  description:
    "Secure clinical management and appointment scheduling portal for authorized hospital staff.",
};

export default function StaffRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffAuthProvider>
      <div className={styles.container}>
        <Suspense fallback={null}>
          <StaffNavbar />
        </Suspense>
        <main className={styles.main}>
          <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </StaffAuthProvider>
  );
}
