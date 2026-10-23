"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "../../staff.module.css";

interface StaffUserRecord {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  isActive: boolean;
  createdAt: string;
}

export default function StaffAdminUsersPage() {
  const [users, setUsers] = useState<StaffUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "ADMIN">("EMPLOYEE");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/users");
      if (!res.ok) throw new Error("Failed to load staff users");
      const json = await res.json();
      setUsers(json.data || []);
    } catch {
      setError("Unable to load staff user accounts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/staff/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          password,
          isActive: true,
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok) {
        setSuccessMessage(`Staff account for "${name}" created.`);
        setShowAdd(false);
        setName("");
        setEmail("");
        setPassword("");
        setRole("EMPLOYEE");
        loadUsers();
      } else {
        setError(json?.error?.message || "Failed to create staff account.");
      }
    } catch {
      setError("Network error while creating staff user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (userRec: StaffUserRecord) => {
    try {
      const res = await fetch(`/api/staff/users/${userRec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !userRec.isActive }),
      });
      if (res.ok) {
        setSuccessMessage(`Staff account status updated.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        loadUsers();
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message || "Failed to update staff user status.");
      }
    } catch {
      setError("Network error while updating user.");
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Staff Accounts & Access Control</h1>
          <p className={styles.pageSubtitle}>
            Provision employee access and assign administrative roles to hospital personnel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className={styles.btnPrimary}
        >
          {showAdd ? "Cancel" : "+ Add Staff User"}
        </button>
      </div>

      {successMessage && <div className={styles.successAlert}>{successMessage}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}

      {showAdd && (
        <div
          className={styles.detailCard}
          style={{ marginBottom: "2rem", border: "2px solid var(--color-teal)" }}
        >
          <h2 className={styles.sectionTitle}>Create Staff User Account</h2>
          <form onSubmit={handleCreate} className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label htmlFor="user-name" className={styles.filterLabel}>
                Full Name *
              </label>
              <input
                type="text"
                id="user-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rachel Adams, RN"
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="user-email" className={styles.filterLabel}>
                Email Address *
              </label>
              <input
                type="email"
                id="user-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. radams@fictional-wellspring.local"
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="user-role" className={styles.filterLabel}>
                System Role *
              </label>
              <select
                id="user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "EMPLOYEE" | "ADMIN")}
                className={styles.select}
              >
                <option value="EMPLOYEE">EMPLOYEE (Appointments only)</option>
                <option value="ADMIN">ADMIN (Full administrative access)</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="user-password" className={styles.filterLabel}>
                Initial Password * (Min 6 chars)
              </label>
              <input
                type="password"
                id="user-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={styles.input}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", gridColumn: "1 / -1" }}>
              <button type="submit" disabled={isSubmitting} className={styles.btnPrimary}>
                {isSubmitting ? "Creating Account…" : "Create Staff Account"}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className={styles.btnSecondary}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loadingBox}>
          <p>Loading staff accounts…</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Staff Member</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Assigned Role</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Created Date</th>
                <th className={styles.th} style={{ textAlign: "right" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={styles.tr}>
                  <td className={styles.td}>
                    <strong>{u.name}</strong>
                  </td>
                  <td className={styles.td}>{u.email}</td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.badge} ${
                        u.role === "ADMIN" ? styles.badgePending : styles.badgeCompleted
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.badge} ${
                        u.isActive ? styles.badgeConfirmed : styles.badgeCancelled
                      }`}
                    >
                      {u.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {new Date(u.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleToggle(u)}
                      className={u.isActive ? styles.btnSecondary : styles.btnPrimary}
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
