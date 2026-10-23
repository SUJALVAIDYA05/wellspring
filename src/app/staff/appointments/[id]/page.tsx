"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStaffAuth } from "../../StaffAuthContext";
import styles from "../../staff.module.css";

interface AppointmentDetail {
  id: string;
  referenceCode: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  startsAt: string;
  endsAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  reasonForVisit: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  doctor: {
    id: string;
    slug: string;
    fullName: string;
    specialty: string;
    department?: {
      id: string;
      name: string;
    };
  };
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  updatedByUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface AvailableSlot {
  startsAt: string;
  endsAt: string;
  time: string;
  date: string;
}

export default function StaffAppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const appointmentId = resolvedParams.id;

  const { user, isLoading: authLoading } = useStaffAuth();
  const router = useRouter();

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Status update state
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Reschedule state
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Load appointment details
  const loadAppointment = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/appointments/${appointmentId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError(`Appointment '${appointmentId}' was not found in the system.`);
          return;
        }
        if (res.status === 401) {
          setError("Session expired or unauthorized. Please sign in.");
          return;
        }
        throw new Error("Failed to load appointment details");
      }

      const json = await res.json();
      setAppointment(json.data);
      setNewStatus(json.data.status);
    } catch {
      setError("Unable to retrieve appointment record. Please verify connection and retry.");
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (user) {
      loadAppointment();
    }
  }, [user, loadAppointment]);

  // Load slots when reschedule date is chosen
  useEffect(() => {
    if (!showReschedule || !rescheduleDate || !appointment) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }

    let isMounted = true;
    async function fetchSlots() {
      setIsLoadingSlots(true);
      setSlotsError(null);
      setSelectedSlot(null);

      try {
        const res = await fetch(
          `/api/doctors/${appointment!.doctor.slug}/availability?from=${rescheduleDate}&to=${rescheduleDate}`
        );
        if (!isMounted) return;

        if (res.ok) {
          const json = await res.json();
          setAvailableSlots(json.slots || []);
        } else {
          setSlotsError("No slots available for this physician on the selected date.");
        }
      } catch {
        if (isMounted) setSlotsError("Failed to check slot availability.");
      } finally {
        if (isMounted) setIsLoadingSlots(false);
      }
    }

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [showReschedule, rescheduleDate, appointment]);

  // Handle Status Update
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdatingStatus || !appointment) return;

    setError(null);
    setSuccessMessage(null);
    setIsUpdatingStatus(true);

    try {
      const res = await fetch(`/api/staff/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          cancellationReason: newStatus === "CANCELLED" ? statusReason.trim() : undefined,
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok) {
        setSuccessMessage(`Appointment status updated to ${newStatus}.`);
        loadAppointment();
      } else {
        setError(json?.error?.message || "Failed to update appointment status.");
      }
    } catch {
      setError("Network error while updating appointment status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Reschedule
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRescheduling || !appointment || !selectedSlot) return;

    setError(null);
    setSuccessMessage(null);
    setIsRescheduling(true);

    try {
      const res = await fetch(`/api/staff/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: selectedSlot.startsAt,
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok) {
        setSuccessMessage(
          `Appointment successfully rescheduled to ${selectedSlot.date} at ${selectedSlot.time}.`
        );
        setShowReschedule(false);
        loadAppointment();
      } else {
        setError(
          json?.error?.message ||
            "Unable to reschedule: the slot may have become unavailable or conflicts with a schedule."
        );
      }
    } catch {
      setError("Network error while rescheduling appointment.");
    } finally {
      setIsRescheduling(false);
    }
  };

  // Handle Direct Cancellation Action
  const handleDirectCancel = async () => {
    if (!appointment) return;
    const confirmed = window.confirm(
      `Are you sure you want to CANCEL appointment ${appointment.referenceCode}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/staff/appointments/${appointment.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by hospital staff via portal action" }),
      });

      if (res.ok) {
        setSuccessMessage("Appointment has been cancelled and the slot released.");
        loadAppointment();
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message || "Failed to cancel appointment.");
      }
    } catch {
      setError("Network error while cancelling appointment.");
    }
  };

  // Auth Guard
  if (authLoading) {
    return (
      <div className={styles.loadingBox}>
        <p>Verifying staff permissions…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.forbiddenBox}>
        <h1 className={styles.forbiddenTitle}>Staff Authentication Required</h1>
        <p className={styles.forbiddenText}>
          You must be signed in with an authorized hospital staff account.
        </p>
        <Link href="/staff/login" className={styles.btnPrimary}>
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loadingBox}>
        <p>Loading clinical appointment record…</p>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div>
        <div className={styles.errorAlert} role="alert">
          {error}
        </div>
        <Link href="/staff/appointments" className={styles.btnSecondary}>
          ← Back to All Appointments
        </Link>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  let statusBadgeClass = styles.badgePending;
  if (appointment.status === "CONFIRMED") statusBadgeClass = styles.badgeConfirmed;
  if (appointment.status === "CANCELLED") statusBadgeClass = styles.badgeCancelled;
  if (appointment.status === "COMPLETED") statusBadgeClass = styles.badgeCompleted;
  if (appointment.status === "NO_SHOW") statusBadgeClass = styles.badgeNoShow;

  const startFormatted = new Date(appointment.startsAt).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const endFormatted = new Date(appointment.endsAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/staff/appointments" className={styles.btnSecondary} style={{ fontSize: "0.85rem" }}>
          ← Back to Appointments Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
            <h1 className={styles.pageTitle} style={{ margin: 0 }}>
              {appointment.referenceCode}
            </h1>
            <span className={`${styles.badge} ${statusBadgeClass}`} style={{ fontSize: "0.85rem" }}>
              {appointment.status}
            </span>
          </div>
          <p className={styles.pageSubtitle}>
            Patient: <strong>{appointment.patientName}</strong> • Attending:{" "}
            <strong>{appointment.doctor.fullName}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          {appointment.status !== "CANCELLED" && (
            <button type="button" onClick={handleDirectCancel} className={styles.btnDanger}>
              Cancel Appointment
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowReschedule(!showReschedule)}
            className={styles.btnSecondary}
          >
            {showReschedule ? "Close Reschedule" : "Reschedule Slot"}
          </button>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Reschedule Drawer/Panel */}
      {showReschedule && (
        <div
          className={styles.detailCard}
          style={{ marginBottom: "2rem", border: "2px solid var(--color-teal)" }}
        >
          <h2 className={styles.sectionTitle}>Reschedule Appointment Slot</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
            Select a new future date for <strong>{appointment.doctor.fullName}</strong>. Live availability
            will be server-calculated to avoid overlapping bookings.
          </p>

          <form onSubmit={handleRescheduleSubmit}>
            <div style={{ maxWidth: "320px", marginBottom: "1rem" }}>
              <label htmlFor="reschedule-date" className={styles.filterLabel}>
                Choose New Date
              </label>
              <input
                type="date"
                id="reschedule-date"
                required
                min={todayIso}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className={styles.input}
              />
            </div>

            {isLoadingSlots && (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                Checking physician schedules and existing bookings…
              </p>
            )}

            {slotsError && (
              <p style={{ fontSize: "0.85rem", color: "var(--color-emergency)" }}>{slotsError}</p>
            )}

            {availableSlots.length > 0 && (
              <div style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
                <span className={styles.filterLabel} style={{ display: "block", marginBottom: "0.5rem" }}>
                  Select Available Slot
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.startsAt === slot.startsAt;
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={isSelected ? styles.btnPrimary : styles.btnSecondary}
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="submit"
                disabled={isRescheduling || !selectedSlot}
                className={styles.btnPrimary}
              >
                {isRescheduling ? "Rescheduling Slot…" : "Confirm Reschedule"}
              </button>
              <button
                type="button"
                onClick={() => setShowReschedule(false)}
                className={styles.btnSecondary}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Detail Grid */}
      <div className={styles.detailGrid}>
        {/* Left: Comprehensive Record */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Patient and Consultation Details */}
          <div className={styles.detailCard}>
            <h2 className={styles.sectionTitle}>Patient Information</h2>
            <div className={styles.fieldRow}>
              <span className={styles.fieldKey}>Full Name:</span>
              <span className={styles.fieldValue}>
                <strong>{appointment.patientName}</strong>
              </span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldKey}>Phone Contact:</span>
              <span className={styles.fieldValue}>
                <a href={`tel:${appointment.patientPhone}`}>{appointment.patientPhone}</a>
              </span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldKey}>Email Address:</span>
              <span className={styles.fieldValue}>
                {appointment.patientEmail ? (
                  <a href={`mailto:${appointment.patientEmail}`}>{appointment.patientEmail}</a>
                ) : (
                  <span style={{ color: "var(--color-text-muted)" }}>None provided</span>
                )}
              </span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldKey}>Reason for Visit:</span>
              <span className={styles.fieldValue}>
                {appointment.reasonForVisit || (
                  <span style={{ color: "var(--color-text-muted)" }}>No reason specified</span>
                )}
              </span>
            </div>
            {appointment.cancellationReason && (
              <div className={styles.fieldRow}>
                <span className={styles.fieldKey}>Cancellation Note:</span>
                <span className={styles.fieldValue} style={{ color: "var(--color-emergency)" }}>
                  {appointment.cancellationReason}
                </span>
              </div>
            )}
          </div>

          {/* Clinical Booking Schedule */}
          <div className={styles.detailCard}>
            <h2 className={styles.sectionTitle}>Schedule & Clinical Assignment</h2>
            <div className={styles.fieldRow}>
              <span className={styles.fieldKey}>Attending Doctor:</span>
              <span className={styles.fieldValue}>
                <strong>{appointment.doctor.fullName}</strong> ({appointment.doctor.specialty})
              </span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldKey}>Department:</span>
              <span className={styles.fieldValue}>
                {appointment.doctor.department?.name || "General Outpatient"}
              </span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldKey}>Start Time:</span>
              <span className={styles.fieldValue}>{startFormatted}</span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldKey}>End Time:</span>
              <span className={styles.fieldValue}>{endFormatted}</span>
            </div>
          </div>

          {/* System Audit Details */}
          <div className={styles.detailCard}>
            <h2 className={styles.sectionTitle}>Audit & Provenance</h2>
            <div className={styles.fieldRow}>
              <span className={styles.fieldKey}>Created Timestamp:</span>
              <span className={styles.fieldValue}>
                {new Date(appointment.createdAt).toLocaleString()}
              </span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldKey}>Last Modified:</span>
              <span className={styles.fieldValue}>
                {new Date(appointment.updatedAt).toLocaleString()}
              </span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldKey}>Created Origin:</span>
              <span className={styles.fieldValue}>
                {appointment.createdByUser
                  ? `Staff Member: ${appointment.createdByUser.name} (${appointment.createdByUser.role})`
                  : "Public Patient Self-Scheduling"}
              </span>
            </div>
            {appointment.updatedByUser && (
              <div className={styles.fieldRow}>
                <span className={styles.fieldKey}>Modified By:</span>
                <span className={styles.fieldValue}>
                  {appointment.updatedByUser.name} ({appointment.updatedByUser.role})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Management Controls */}
        <div>
          <div className={styles.detailCard}>
            <h2 className={styles.sectionTitle}>Manage Status</h2>

            <form onSubmit={handleStatusSubmit}>
              <div className={styles.filterGroup}>
                <label htmlFor="update-status-select" className={styles.filterLabel}>
                  Change Status
                </label>
                <select
                  id="update-status-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className={styles.select}
                >
                  <option value="PENDING">PENDING (Hold)</option>
                  <option value="CONFIRMED">CONFIRMED (Scheduled)</option>
                  <option value="COMPLETED">COMPLETED (Consulted)</option>
                  <option value="CANCELLED">CANCELLED (Released)</option>
                  <option value="NO_SHOW">NO_SHOW (Missed)</option>
                </select>
              </div>

              {newStatus === "CANCELLED" && (
                <div className={styles.filterGroup} style={{ marginTop: "1rem" }}>
                  <label htmlFor="cancel-reason" className={styles.filterLabel}>
                    Cancellation Reason (Optional)
                  </label>
                  <textarea
                    id="cancel-reason"
                    rows={3}
                    placeholder="Provide reason for cancellation..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className={styles.textarea}
                  />
                </div>
              )}

              <div style={{ marginTop: "1.25rem" }}>
                <button
                  type="submit"
                  disabled={isUpdatingStatus || newStatus === appointment.status}
                  className={styles.btnPrimary}
                  style={{ width: "100%" }}
                >
                  {isUpdatingStatus ? "Applying Status…" : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
