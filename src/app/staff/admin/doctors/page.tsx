"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "../../staff.module.css";

interface DoctorRecord {
  id: string;
  slug: string;
  fullName: string;
  specialty: string;
  qualifications: string[];
  isActive: boolean;
  department?: {
    id: string;
    name: string;
  };
}

interface DepartmentOption {
  id: string;
  name: string;
}

export default function StaffAdminDoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add doctor modal form
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [slug, setSlug] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [biography, setBiography] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDoctors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [docRes, deptRes] = await Promise.all([
        fetch("/api/doctors"),
        fetch("/api/departments"),
      ]);

      if (!docRes.ok || !deptRes.ok) {
        throw new Error("Failed to load doctors or departments");
      }

      const docJson = await docRes.json();
      const deptJson = await deptRes.json();

      setDoctors(docJson.data || []);
      setDepartments(deptJson.data || []);
      if (deptJson.data?.length > 0) {
        setDepartmentId(deptJson.data[0].id);
      }
    } catch {
      setError("Unable to load physicians records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleToggleActive = async (doctor: DoctorRecord) => {
    try {
      const res = await fetch(`/api/staff/doctors/${doctor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !doctor.isActive }),
      });

      if (res.ok) {
        setSuccessMessage(
          `Dr. ${doctor.fullName} is now ${!doctor.isActive ? "ACTIVE" : "INACTIVE"}.`
        );
        setTimeout(() => setSuccessMessage(null), 4000);
        loadDoctors();
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message || "Failed to update physician status.");
      }
    } catch {
      setError("Network error while updating physician status.");
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const qualsArray = qualifications
        .split(",")
        .map((q) => q.trim())
        .filter(Boolean);

      const res = await fetch("/api/staff/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          slug: slug.trim().toLowerCase(),
          specialty: specialty.trim(),
          departmentId,
          qualifications: qualsArray.length > 0 ? qualsArray : ["Board Certified"],
          biography: biography.trim() || undefined,
          isActive: true,
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok) {
        setSuccessMessage(`Physician ${fullName} created successfully.`);
        setShowAddModal(false);
        setFullName("");
        setSlug("");
        setSpecialty("");
        setQualifications("");
        setBiography("");
        loadDoctors();
      } else {
        setError(json?.error?.message || "Failed to create physician.");
      }
    } catch {
      setError("Network error while creating physician.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Physician Management</h1>
          <p className={styles.pageSubtitle}>
            Maintain doctor credentials, specialty assignments, and active availability.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(!showAddModal)}
          className={styles.btnPrimary}
        >
          {showAddModal ? "Cancel" : "+ Add Physician"}
        </button>
      </div>

      {successMessage && <div className={styles.successAlert}>{successMessage}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}

      {showAddModal && (
        <div
          className={styles.detailCard}
          style={{ marginBottom: "2rem", border: "2px solid var(--color-teal)" }}
        >
          <h2 className={styles.sectionTitle}>Add New Physician</h2>
          <form onSubmit={handleAddDoctor} className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label htmlFor="doc-fullname" className={styles.filterLabel}>
                Full Name <span style={{ color: "var(--color-emergency)" }}>*</span>
              </label>
              <input
                type="text"
                id="doc-fullname"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (!slug) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "")
                    );
                  }
                }}
                placeholder="e.g. Dr. Jordan Lee"
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="doc-slug" className={styles.filterLabel}>
                URL Slug <span style={{ color: "var(--color-emergency)" }}>*</span>
              </label>
              <input
                type="text"
                id="doc-slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. dr-jordan-lee"
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="doc-specialty" className={styles.filterLabel}>
                Clinical Specialty <span style={{ color: "var(--color-emergency)" }}>*</span>
              </label>
              <input
                type="text"
                id="doc-specialty"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Neurology & Diagnostic Medicine"
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="doc-dept" className={styles.filterLabel}>
                Department <span style={{ color: "var(--color-emergency)" }}>*</span>
              </label>
              <select
                id="doc-dept"
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className={styles.select}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup} style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="doc-quals" className={styles.filterLabel}>
                Qualifications (Comma separated)
              </label>
              <input
                type="text"
                id="doc-quals"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g. MD, FACP, Board Certified Neurologist"
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup} style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="doc-bio" className={styles.filterLabel}>
                Professional Biography
              </label>
              <textarea
                id="doc-bio"
                rows={3}
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                placeholder="Enter doctor's clinical background and experience..."
                className={styles.textarea}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="submit" disabled={isSubmitting} className={styles.btnPrimary}>
                {isSubmitting ? "Creating…" : "Save Physician"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
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
          <p>Loading physicians directory…</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No physicians currently registered in the database.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Physician</th>
                <th className={styles.th}>Specialty</th>
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: "right" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc.id} className={styles.tr}>
                  <td className={styles.td}>
                    <strong>{doc.fullName}</strong>
                    <div className={styles.patientMeta}>Slug: {doc.slug}</div>
                  </td>
                  <td className={styles.td}>{doc.specialty}</td>
                  <td className={styles.td}>{doc.department?.name || "General"}</td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.badge} ${
                        doc.isActive ? styles.badgeConfirmed : styles.badgeCancelled
                      }`}
                    >
                      {doc.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(doc)}
                      className={doc.isActive ? styles.btnSecondary : styles.btnPrimary}
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      {doc.isActive ? "Deactivate" : "Activate"}
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
