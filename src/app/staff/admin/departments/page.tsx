"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "../../staff.module.css";

interface DepartmentRecord {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  isActive: boolean;
  _count?: {
    doctors: number;
    services: number;
  };
}

export default function StaffAdminDepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Failed to load departments");
      const json = await res.json();
      setDepartments(json.data || []);
    } catch {
      setError("Unable to retrieve departments.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/staff/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          summary: summary.trim(),
          description: description.trim(),
          isActive: true,
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok) {
        setSuccessMessage(`Department "${name}" created successfully.`);
        setShowAdd(false);
        setName("");
        setSlug("");
        setSummary("");
        setDescription("");
        loadDepartments();
      } else {
        setError(json?.error?.message || "Failed to create department.");
      }
    } catch {
      setError("Network error while creating department.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (dept: DepartmentRecord) => {
    try {
      const res = await fetch(`/api/staff/departments/${dept.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !dept.isActive }),
      });
      if (res.ok) {
        setSuccessMessage(`Department status updated.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        loadDepartments();
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message || "Failed to update department.");
      }
    } catch {
      setError("Network error while updating department.");
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Department Directory</h1>
          <p className={styles.pageSubtitle}>
            Manage clinical departments, operational overviews, and service scopes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className={styles.btnPrimary}
        >
          {showAdd ? "Cancel" : "+ Add Department"}
        </button>
      </div>

      {successMessage && <div className={styles.successAlert}>{successMessage}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}

      {showAdd && (
        <div
          className={styles.detailCard}
          style={{ marginBottom: "2rem", border: "2px solid var(--color-teal)" }}
        >
          <h2 className={styles.sectionTitle}>Create New Department</h2>
          <form onSubmit={handleCreate} className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label htmlFor="dept-name" className={styles.filterLabel}>
                Department Name *
              </label>
              <input
                type="text"
                id="dept-name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "")
                    );
                  }
                }}
                placeholder="e.g. Ophthalmology & Eye Surgery"
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="dept-slug" className={styles.filterLabel}>
                URL Slug *
              </label>
              <input
                type="text"
                id="dept-slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. ophthalmology"
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup} style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="dept-summary" className={styles.filterLabel}>
                Summary Statement *
              </label>
              <input
                type="text"
                id="dept-summary"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief one-line summary of clinical offerings..."
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup} style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="dept-desc" className={styles.filterLabel}>
                Full Department Overview *
              </label>
              <textarea
                id="dept-desc"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed clinical scope, specialized equipment, and care philosophy..."
                className={styles.textarea}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="submit" disabled={isSubmitting} className={styles.btnPrimary}>
                {isSubmitting ? "Creating…" : "Save Department"}
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
          <p>Loading departments…</p>
        </div>
      ) : departments.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No departments registered.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Summary</th>
                <th className={styles.th}>Physicians</th>
                <th className={styles.th}>Services</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: "right" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className={styles.tr}>
                  <td className={styles.td}>
                    <strong>{d.name}</strong>
                    <div className={styles.patientMeta}>Slug: {d.slug}</div>
                  </td>
                  <td className={styles.td}>{d.summary}</td>
                  <td className={styles.td}>{d._count?.doctors ?? "—"}</td>
                  <td className={styles.td}>{d._count?.services ?? "—"}</td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.badge} ${
                        d.isActive ? styles.badgeConfirmed : styles.badgeCancelled
                      }`}
                    >
                      {d.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleToggle(d)}
                      className={d.isActive ? styles.btnSecondary : styles.btnPrimary}
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      {d.isActive ? "Deactivate" : "Activate"}
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
