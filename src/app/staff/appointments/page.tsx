"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useStaffAuth } from "../StaffAuthContext";
import styles from "../staff.module.css";

interface AppointmentItem {
  id: string;
  referenceCode: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  startsAt: string;
  endsAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  reasonForVisit: string | null;
  doctor: {
    id: string;
    fullName: string;
    specialty: string;
    department?: {
      id: string;
      name: string;
    };
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DoctorOption {
  id: string;
  slug: string;
  fullName: string;
}

export default function StaffAppointmentsDashboardPage() {
  const { user, isLoading: authLoading } = useStaffAuth();

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [refSearch, setRefSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Data
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [doctorsList, setDoctorsList] = useState<DoctorOption[]>([]);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load doctors for dropdown
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch("/api/doctors");
        if (res.ok) {
          const json = await res.json();
          setDoctorsList(json.data || []);
        }
      } catch {
        // ignore
      }
    }
    fetchDoctors();
  }, []);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    params.set("limit", "15");

    if (statusFilter) params.set("status", statusFilter);
    if (doctorFilter) params.set("doctorId", doctorFilter);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (refSearch.trim()) params.set("referenceCode", refSearch.trim());

    try {
      const res = await fetch(`/api/staff/appointments?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired or authentication required. Please sign in.");
          return;
        }
        throw new Error("Failed to load appointments");
      }

      const json = await res.json();
      setAppointments(json.data || []);
      if (json.pagination) {
        setPagination(json.pagination);
      }
    } catch {
      setError("Unable to retrieve appointment records. Please check connection and retry.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, doctorFilter, fromDate, toDate, refSearch]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, fetchAppointments]);

  // Quick confirm status action
  const handleQuickConfirm = async (id: string, refCode: string) => {
    try {
      const res = await fetch(`/api/staff/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      if (res.ok) {
        setSuccessMessage(`Appointment ${refCode} has been CONFIRMED.`);
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchAppointments();
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message || "Failed to update appointment status.");
      }
    } catch {
      setError("Network error while updating appointment.");
    }
  };

  const clearFilters = () => {
    setStatusFilter("");
    setDoctorFilter("");
    setFromDate("");
    setToDate("");
    setRefSearch("");
    setCurrentPage(1);
  };

  // Auth Guard
  if (authLoading) {
    return (
      <div className={styles.loadingBox}>
        <p>Verifying staff credentials…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.forbiddenBox}>
        <h1 className={styles.forbiddenTitle}>Staff Authentication Required</h1>
        <p className={styles.forbiddenText}>
          You must be signed in with an authorized hospital staff account to access the appointment
          dashboard.
        </p>
        <Link href="/staff/login" className={styles.btnPrimary}>
          Sign In to Staff Portal
        </Link>
      </div>
    );
  }

  // Calculate quick metrics from current appointments
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Clinical Appointments</h1>
          <p className={styles.pageSubtitle}>
            Review, confirm, reschedule, and manage patient bookings across all departments.
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Filtered</div>
          <div className={styles.kpiValue}>{pagination.total}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Pending on Page</div>
          <div className={styles.kpiValue} style={{ color: "#b45309" }}>
            {pendingCount}
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Confirmed on Page</div>
          <div className={styles.kpiValue} style={{ color: "#047857" }}>
            {confirmedCount}
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Cancelled on Page</div>
          <div className={styles.kpiValue} style={{ color: "#b91c1c" }}>
            {cancelledCount}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className={styles.successAlert} role="status">
          {successMessage}
        </div>
      )}

      {error && (
        <div className={styles.errorAlert} role="alert">
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className={styles.filterBar}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCurrentPage(1);
            fetchAppointments();
          }}
          className={styles.filterGrid}
        >
          {/* Status */}
          <div className={styles.filterGroup}>
            <label htmlFor="filter-status" className={styles.filterLabel}>
              Status
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.select}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="NO_SHOW">NO_SHOW</option>
            </select>
          </div>

          {/* Doctor */}
          <div className={styles.filterGroup}>
            <label htmlFor="filter-doctor" className={styles.filterLabel}>
              Physician
            </label>
            <select
              id="filter-doctor"
              value={doctorFilter}
              onChange={(e) => {
                setDoctorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.select}
            >
              <option value="">All Physicians</option>
              {doctorsList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className={styles.filterGroup}>
            <label htmlFor="filter-from" className={styles.filterLabel}>
              From Date
            </label>
            <input
              type="date"
              id="filter-from"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.input}
            />
          </div>

          {/* To Date */}
          <div className={styles.filterGroup}>
            <label htmlFor="filter-to" className={styles.filterLabel}>
              To Date
            </label>
            <input
              type="date"
              id="filter-to"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.input}
            />
          </div>

          {/* Reference Search */}
          <div className={styles.filterGroup}>
            <label htmlFor="filter-ref" className={styles.filterLabel}>
              Reference Code
            </label>
            <input
              type="search"
              id="filter-ref"
              placeholder="e.g. APT-7K9M-4P2Q"
              value={refSearch}
              onChange={(e) => setRefSearch(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Filter Actions */}
          <div className={styles.filterActions}>
            <button type="submit" className={styles.btnPrimary}>
              Search
            </button>
            <button type="button" onClick={clearFilters} className={styles.btnSecondary}>
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Appointments Table */}
      {isLoading ? (
        <div className={styles.loadingBox}>
          <p>Loading appointments data…</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No Appointments Found</h3>
          <p>No appointments match the selected search and filter criteria.</p>
          <button
            type="button"
            onClick={clearFilters}
            className={styles.btnSecondary}
            style={{ marginTop: "1rem" }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Reference</th>
                <th className={styles.th}>Patient Details</th>
                <th className={styles.th}>Physician / Dept</th>
                <th className={styles.th}>Date & Time (UTC)</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => {
                const dateFormatted = new Date(apt.startsAt).toLocaleDateString(undefined, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const timeFormatted = new Date(apt.startsAt).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                let statusBadgeClass = styles.badgePending;
                if (apt.status === "CONFIRMED") statusBadgeClass = styles.badgeConfirmed;
                if (apt.status === "CANCELLED") statusBadgeClass = styles.badgeCancelled;
                if (apt.status === "COMPLETED") statusBadgeClass = styles.badgeCompleted;
                if (apt.status === "NO_SHOW") statusBadgeClass = styles.badgeNoShow;

                return (
                  <tr key={apt.id} className={styles.tr}>
                    <td className={styles.td}>
                      <Link
                        href={`/staff/appointments/${apt.id}`}
                        className={styles.refLink}
                        title="View details and manage appointment"
                      >
                        {apt.referenceCode}
                      </Link>
                    </td>

                    <td className={styles.td}>
                      <strong>{apt.patientName}</strong>
                      <div className={styles.patientMeta}>
                        {apt.patientPhone}
                        {apt.patientEmail && ` • ${apt.patientEmail}`}
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div>{apt.doctor.fullName}</div>
                      <div className={styles.patientMeta}>
                        {apt.doctor.department?.name || apt.doctor.specialty}
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div>{dateFormatted}</div>
                      <div className={styles.patientMeta}>{timeFormatted}</div>
                    </td>

                    <td className={styles.td}>
                      <span className={`${styles.badge} ${statusBadgeClass}`}>{apt.status}</span>
                    </td>

                    <td className={styles.td} style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        {apt.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => handleQuickConfirm(apt.id, apt.referenceCode)}
                            className={styles.btnPrimary}
                            style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem" }}
                            title="Confirm this pending appointment"
                          >
                            Confirm
                          </button>
                        )}
                        <Link
                          href={`/staff/appointments/${apt.id}`}
                          className={styles.btnSecondary}
                          style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem" }}
                        >
                          Manage →
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className={styles.pagination}>
            <div className={styles.pageInfo}>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total
              records)
            </div>
            <div className={styles.pageNav}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={styles.btnSecondary}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className={styles.btnSecondary}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
