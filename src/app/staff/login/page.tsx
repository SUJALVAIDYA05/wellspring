"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStaffAuth } from "../StaffAuthContext";
import styles from "../staff.module.css";

export default function StaffLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { refreshUser } = useStaffAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/staff/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok) {
        await refreshUser();
        router.push("/staff/appointments");
        return;
      }

      setError(
        json?.error?.message || "Invalid credentials. Please verify your email and password."
      );
    } catch {
      setError("Network communication error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (role: "admin" | "staff") => {
    if (role === "admin") {
      setEmail("admin@fictional-wellspring.local");
      setPassword("Admin1234!");
    } else {
      setEmail("staff@fictional-wellspring.local");
      setPassword("Staff1234!");
    }
    setError(null);
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Hospital Staff Portal</h1>
          <p className={styles.loginSubtitle}>
            Authorized clinical and administrative personnel sign-in
          </p>
        </div>

        {error && (
          <div className={styles.errorAlert} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.filterGroup}>
          <div className={styles.filterGroup}>
            <label htmlFor="staff-email" className={styles.filterLabel}>
              Staff Email Address
            </label>
            <input
              type="email"
              id="staff-email"
              required
              disabled={isSubmitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. staff@fictional-wellspring.local"
              className={styles.input}
            />
          </div>

          <div className={styles.filterGroup} style={{ marginTop: "1rem" }}>
            <label htmlFor="staff-password" className={styles.filterLabel}>
              Password
            </label>
            <input
              type="password"
              id="staff-password"
              required
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className={styles.input}
            />
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.btnPrimary}
              style={{ width: "100%", padding: "0.75rem", fontSize: "1rem" }}
            >
              {isSubmitting ? "Verifying Credentials…" : "Sign In to Portal"}
            </button>
          </div>
        </form>

        {/* Development Seed Testing Convenience */}
        <div className={styles.demoCredentials}>
          <strong>Fictional Dev Test Accounts:</strong>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={() => fillCredentials("admin")}
              className={styles.btnSecondary}
              style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
            >
              Fill Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("staff")}
              className={styles.btnSecondary}
              style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
            >
              Fill Staff Employee
            </button>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link href="/" style={{ fontSize: "0.85rem", color: "var(--color-teal-dark)" }}>
            ← Back to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
