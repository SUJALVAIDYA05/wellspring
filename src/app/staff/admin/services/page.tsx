"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "../../staff.module.css";

interface ServiceRecord {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  isActive: boolean;
  department?: {
    id: string;
    name: string;
  } | null;
}

interface DepartmentOption {
  id: string;
  name: string;
}

export default function StaffAdminServicesPage() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [srvRes, deptRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/departments"),
      ]);

      if (!srvRes.ok || !deptRes.ok) throw new Error("Failed to load services");

      const srvJson = await srvRes.json();
      const deptJson = await deptRes.json();

      setServices(srvJson.data || []);
      setDepartments(deptJson.data || []);
      if (deptJson.data?.length > 0) {
        setDepartmentId(deptJson.data[0].id);
      }
    } catch {
      setError("Unable to retrieve clinical services.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/staff/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          summary: summary.trim(),
          description: description.trim(),
          departmentId: departmentId || undefined,
          isActive: true,
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok) {
        setSuccessMessage(`Clinical service "${name}" created.`);
        setShowAdd(false);
        setName("");
        setSlug("");
        setSummary("");
        setDescription("");
        loadData();
      } else {
        setError(json?.error?.message || "Failed to create service.");
      }
    } catch {
      setError("Network error while creating service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (srv: ServiceRecord) => {
    try {
      const res = await fetch(`/api/staff/services/${srv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !srv.isActive }),
      });
      if (res.ok) {
        setSuccessMessage(`Service status updated.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        loadData();
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message || "Failed to update service status.");
      }
    } catch {
      setError("Network error while updating service status.");
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Clinical Services</h1>
          <p className={styles.pageSubtitle}>
            Configure outpatient treatments, diagnostics, and department affiliations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className={styles.btnPrimary}
        >
          {showAdd ? "Cancel" : "+ Add Service"}
        </button>
      </div>

      {successMessage && <div className={styles.successAlert}>{successMessage}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}

      {showAdd && (
        <div
          className={styles.detailCard}
          style={{ marginBottom: "2rem", border: "2px solid var(--color-teal)" }}
        >
          <h2 className={styles.sectionTitle}>Add New Clinical Service</h2>
          <form onSubmit={handleCreate} className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label htmlFor="srv-name" className={styles.filterLabel}>
                Service Name *
              </label>
              <input
                type="text"
                id="srv-name"
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
                placeholder="e.g. Echocardiogram & Doppler Study"
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="srv-slug" className={styles.filterLabel}>
                URL Slug *
              </label>
              <input
                type="text"
                id="srv-slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. echocardiogram-doppler"
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="srv-dept" className={styles.filterLabel}>
                Department Affiliation
              </label>
              <select
                id="srv-dept"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className={styles.select}
              >
                <option value="">(No specific department)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup} style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="srv-summary" className={styles.filterLabel}>
                Clinical Summary *
              </label>
              <input
                type="text"
                id="srv-summary"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of procedure and indications..."
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup} style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="srv-desc" className={styles.filterLabel}>
                Full Description *
              </label>
              <textarea
                id="srv-desc"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Diagnostic criteria, preparation guidelines, and clinical delivery..."
                className={styles.textarea}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="submit" disabled={isSubmitting} className={styles.btnPrimary}>
                {isSubmitting ? "Creating…" : "Save Service"}
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
          <p>Loading services…</p>
        </div>
      ) : services.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No services registered.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Service</th>
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Summary</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: "right" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className={styles.tr}>
                  <td className={styles.td}>
                    <strong>{s.name}</strong>
                    <div className={styles.patientMeta}>Slug: {s.slug}</div>
                  </td>
                  <td className={styles.td}>{s.department?.name || "(Unassigned)"}</td>
                  <td className={styles.td}>{s.summary}</td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.badge} ${
                        s.isActive ? styles.badgeConfirmed : styles.badgeCancelled
                      }`}
                    >
                      {s.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleToggle(s)}
                      className={s.isActive ? styles.btnSecondary : styles.btnPrimary}
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      {s.isActive ? "Deactivate" : "Activate"}
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
