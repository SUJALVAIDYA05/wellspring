"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/common/Button";
import styles from "./appointments.module.css";

interface DepartmentData {
  id: string;
  slug: string;
  name: string;
  summary?: string;
}

interface DoctorData {
  id: string;
  slug: string;
  fullName: string;
  specialty: string;
  departmentId: string;
  department: {
    id: string;
    slug: string;
    name: string;
  };
}

interface AvailableSlot {
  startsAt: string; // ISO UTC
  endsAt: string; // ISO UTC
  time: string; // "09:00" in hospital timezone
  date: string; // "YYYY-MM-DD" in hospital timezone
}

interface BookingSuccessResult {
  referenceCode: string;
  status: string;
  doctorName: string;
  departmentName: string;
  date: string;
  time: string;
}

export function AppointmentBookingForm() {
  const searchParams = useSearchParams();
  const initialDept = searchParams.get("department") || "";
  const initialDoctor = searchParams.get("doctor") || "";

  // Data loaded from backend
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);

  // Form inputs
  const [department, setDepartment] = useState("");
  const [doctor, setDoctor] = useState("");
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [reason, setReason] = useState("");

  // Slots state
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotsFetched, setSlotsFetched] = useState(false);

  // Status & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [slotConflictMessage, setSlotConflictMessage] = useState<string | null>(null);
  const [inactiveDoctorNotice, setInactiveDoctorNotice] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccessResult | null>(null);

  // 1. Fetch departments and active doctors from backend
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoadingInitial(true);
      setInitialLoadError(null);
      try {
        const [deptRes, docRes] = await Promise.all([
          fetch("/api/departments"),
          fetch("/api/doctors"),
        ]);

        if (!deptRes.ok || !docRes.ok) {
          throw new Error("Failed to load departments or doctors");
        }

        const deptJson = await deptRes.json();
        const docJson = await docRes.json();

        if (!isMounted) return;

        const loadedDepts: DepartmentData[] = deptJson.data || [];
        const loadedDocs: DoctorData[] = docJson.data || [];

        setDepartments(loadedDepts);
        setDoctors(loadedDocs);

        // Preselection handling
        if (initialDoctor) {
          const match = loadedDocs.find(
            (d) => d.slug === initialDoctor || d.id === initialDoctor
          );
          if (match) {
            setDoctor(match.slug);
            setDepartment(match.department.slug);
          } else {
            setInactiveDoctorNotice(
              "The requested doctor is not currently available for public booking. Please select an active doctor."
            );
            if (initialDept) {
              setDepartment(initialDept);
            }
          }
        } else if (initialDept) {
          setDepartment(initialDept);
        }
      } catch {
        if (isMounted) {
          setInitialLoadError(
            "Unable to connect to hospital scheduling service. Please check your connection or contact the hospital."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [initialDoctor, initialDept]);

  // 2. Fetch available slots whenever doctor or date changes
  useEffect(() => {
    // Reset selected slot whenever doctor or date changes
    setSelectedSlot(null);
    setSlotConflictMessage(null);

    if (!doctor || !appointmentDate) {
      setAvailableSlots([]);
      setSlotsFetched(false);
      return;
    }

    let isMounted = true;

    async function fetchSlots() {
      setIsLoadingSlots(true);
      setSlotsError(null);
      setSlotsFetched(false);

      try {
        const res = await fetch(
          `/api/doctors/${doctor}/availability?from=${appointmentDate}&to=${appointmentDate}`
        );

        if (!isMounted) return;

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          setSlotsError(
            errData?.error?.message ||
              "Could not retrieve slots for this doctor on the selected date."
          );
          setAvailableSlots([]);
          return;
        }

        const json = await res.json();
        setAvailableSlots(json.slots || []);
        setSlotsFetched(true);
      } catch {
        if (isMounted) {
          setSlotsError("Network error while checking slot availability.");
          setAvailableSlots([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSlots(false);
        }
      }
    }

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [doctor, appointmentDate]);

  // Filter doctors when department changes
  const filteredDoctors = department
    ? doctors.filter((d) => d.department.slug === department || d.department.id === department)
    : doctors;

  // Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!patientName.trim()) {
      errs.patientName = "Patient name is required.";
    } else if (patientName.trim().length < 2) {
      errs.patientName = "Patient name must be at least 2 characters.";
    } else if (patientName.trim().length > 100) {
      errs.patientName = "Patient name must not exceed 100 characters.";
    }

    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{5,15}$/;
    if (!phone.trim()) {
      errs.phone = "Phone number is required.";
    } else if (!phoneRegex.test(phone.trim())) {
      errs.phone = "Please enter a valid phone number (e.g. +1 555-0123).";
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = "Please enter a valid email address.";
      }
    }

    if (!department) {
      errs.department = "Department is required.";
    }

    if (!doctor) {
      errs.doctor = "Doctor is required.";
    }

    if (!appointmentDate) {
      errs.date = "Appointment date is required.";
    } else {
      const selectedDate = new Date(appointmentDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errs.date = "Appointment date cannot be in the past.";
      }
    }

    if (!selectedSlot) {
      errs.slot = "Please select an available appointment time slot.";
    }

    if (reason.trim().length > 500) {
      errs.reason = "Reason for visit must not exceed 500 characters.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent accidental duplicate submissions
    if (isSubmitting) return;

    setServerError(null);
    setSlotConflictMessage(null);

    if (!validateForm()) {
      return;
    }

    const doctorObj = doctors.find((d) => d.slug === doctor || d.id === doctor);
    if (!doctorObj || !selectedSlot) {
      setServerError("Please select a valid doctor and available time slot.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientPhone: phone.trim(),
          patientEmail: email.trim() || undefined,
          doctorId: doctorObj.id,
          departmentId: doctorObj.department?.id || undefined,
          startsAt: selectedSlot.startsAt,
          reasonForVisit: reason.trim() || undefined,
        }),
      });

      const resJson = await res.json().catch(() => null);

      if (res.status === 201 && resJson?.referenceCode) {
        setBookingSuccess({
          referenceCode: resJson.referenceCode,
          status: resJson.status,
          doctorName: doctorObj.fullName,
          departmentName: doctorObj.department?.name,
          date: selectedSlot.date,
          time: selectedSlot.time,
        });
        return;
      }

      if (res.status === 409) {
        // Slot conflict: slot became unavailable
        setSlotConflictMessage(
          "This appointment slot is no longer available. Please choose another available time slot below."
        );
        setSelectedSlot(null);

        // Re-fetch slots to update options
        try {
          const refreshRes = await fetch(
            `/api/doctors/${doctor}/availability?from=${appointmentDate}&to=${appointmentDate}`
          );
          if (refreshRes.ok) {
            const refreshJson = await refreshRes.json();
            setAvailableSlots(refreshJson.slots || []);
          }
        } catch {
          // ignore refresh error
        }
        return;
      }

      if (res.status === 400) {
        setServerError(
          resJson?.error?.message ||
            "The appointment request contains invalid details. Please check the fields and try again."
        );
        return;
      }

      setServerError(
        resJson?.error?.message ||
          "An unexpected server error occurred while booking. Please try again later."
      );
    } catch {
      setServerError(
        "Network communication failure. Please verify your internet connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Confirmation State
  if (bookingSuccess) {
    const isConfirmed = bookingSuccess.status === "CONFIRMED";
    return (
      <div className={styles.successCard} role="status">
        <div className={styles.successHeader}>
          <div className={styles.successIcon} aria-hidden="true">
            ✓
          </div>
          <h2 className={styles.successTitle}>
            {isConfirmed ? "Appointment Confirmed" : "Appointment Request Received"}
          </h2>
          <p className={styles.successSubtitle}>
            {isConfirmed
              ? "Your appointment has been confirmed in the hospital clinical system."
              : "Your appointment request has been securely submitted and reserved pending review by clinical staff."}
          </p>
        </div>

        <div className={styles.refBox}>
          <span className={styles.refLabel}>Booking Reference Code</span>
          <strong className={styles.refCode}>{bookingSuccess.referenceCode}</strong>
          <p className={styles.refHint}>
            Please retain this reference code for your records and hospital check-in.
          </p>
        </div>

        <div className={styles.summaryDetails}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Physician</span>
            <span className={styles.summaryValue}>{bookingSuccess.doctorName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Department</span>
            <span className={styles.summaryValue}>{bookingSuccess.departmentName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Date</span>
            <span className={styles.summaryValue}>{bookingSuccess.date}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Time Slot</span>
            <span className={styles.summaryValue}>{bookingSuccess.time}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Status</span>
            <span
              className={`${styles.statusBadge} ${
                isConfirmed ? styles.statusConfirmed : styles.statusPending
              }`}
            >
              {bookingSuccess.status}
            </span>
          </div>
        </div>

        <div className={styles.successActions}>
          <Button
            onClick={() => {
              setBookingSuccess(null);
              setPatientName("");
              setPhone("");
              setEmail("");
              setReason("");
              setSelectedSlot(null);
              setAvailableSlots([]);
              setDepartment("");
              setDoctor("");
              setAppointmentDate("");
            }}
            variant="primary"
            size="md"
          >
            Book Another Appointment
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingInitial) {
    return (
      <div className={styles.loadingBox}>
        <p>Connecting to hospital scheduling service…</p>
      </div>
    );
  }

  if (initialLoadError) {
    return (
      <div className={styles.errorAlert} role="alert">
        <strong>Service Unavailable</strong>
        <p>{initialLoadError}</p>
      </div>
    );
  }

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <div className={styles.formContainer}>
      {inactiveDoctorNotice && (
        <div className={styles.conflictAlert} role="alert">
          <strong>Doctor Availability Notice</strong>
          <p>{inactiveDoctorNotice}</p>
        </div>
      )}

      {slotConflictMessage && (
        <div className={styles.conflictAlert} role="alert">
          <strong>Slot No Longer Available</strong>
          <p>{slotConflictMessage}</p>
        </div>
      )}

      {serverError && (
        <div className={styles.errorAlert} role="alert">
          <strong>Booking Error</strong>
          <p>{serverError}</p>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.fieldGrid}>
          {/* Patient name */}
          <div className={styles.fieldGroup}>
            <label htmlFor="patient-name" className={styles.label}>
              Patient name <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              id="patient-name"
              name="patientName"
              required
              disabled={isSubmitting}
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                if (fieldErrors.patientName) {
                  setFieldErrors((prev) => ({ ...prev, patientName: "" }));
                }
              }}
              placeholder="Full name of patient"
              className={`${styles.input} ${fieldErrors.patientName ? styles.inputError : ""}`}
            />
            {fieldErrors.patientName && (
              <span className={styles.fieldError}>{fieldErrors.patientName}</span>
            )}
          </div>

          {/* Phone number */}
          <div className={styles.fieldGroup}>
            <label htmlFor="patient-phone" className={styles.label}>
              Phone number <span className={styles.req}>*</span>
            </label>
            <input
              type="tel"
              id="patient-phone"
              name="phone"
              required
              disabled={isSubmitting}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) {
                  setFieldErrors((prev) => ({ ...prev, phone: "" }));
                }
              }}
              placeholder="e.g. +1 555-0123"
              className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ""}`}
            />
            {fieldErrors.phone && (
              <span className={styles.fieldError}>{fieldErrors.phone}</span>
            )}
          </div>
        </div>

        {/* Email address (optional) */}
        <div className={styles.fieldGroup}>
          <label htmlFor="patient-email" className={styles.label}>
            Email address (optional)
          </label>
          <input
            type="email"
            id="patient-email"
            name="email"
            disabled={isSubmitting}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: "" }));
              }
            }}
            placeholder="patient@example.com"
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ""}`}
          />
          {fieldErrors.email && (
            <span className={styles.fieldError}>{fieldErrors.email}</span>
          )}
        </div>

        <div className={styles.fieldGrid}>
          {/* Department or service */}
          <div className={styles.fieldGroup}>
            <label htmlFor="department-select" className={styles.label}>
              Department or service <span className={styles.req}>*</span>
            </label>
            <select
              id="department-select"
              name="department"
              required
              disabled={isSubmitting}
              value={department}
              onChange={(e) => {
                const newDept = e.target.value;
                setDepartment(newDept);
                // Reset doctor if doctor doesn't belong to this department
                const currentDoc = doctors.find((d) => d.slug === doctor);
                if (currentDoc && currentDoc.department.slug !== newDept) {
                  setDoctor("");
                  setSelectedSlot(null);
                  setAvailableSlots([]);
                }
                if (fieldErrors.department) {
                  setFieldErrors((prev) => ({ ...prev, department: "" }));
                }
              }}
              className={`${styles.select} ${fieldErrors.department ? styles.inputError : ""}`}
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.slug} value={dept.slug}>
                  {dept.name}
                </option>
              ))}
            </select>
            {fieldErrors.department && (
              <span className={styles.fieldError}>{fieldErrors.department}</span>
            )}
          </div>

          {/* Doctor */}
          <div className={styles.fieldGroup}>
            <label htmlFor="doctor-select" className={styles.label}>
              Doctor <span className={styles.req}>*</span>
            </label>
            <select
              id="doctor-select"
              name="doctor"
              required
              disabled={isSubmitting}
              value={doctor}
              onChange={(e) => {
                const newDocSlug = e.target.value;
                setDoctor(newDocSlug);
                setSelectedSlot(null);
                setAvailableSlots([]);

                // Auto-sync department if doctor is selected directly
                const matched = doctors.find((d) => d.slug === newDocSlug);
                if (matched && matched.department?.slug) {
                  setDepartment(matched.department.slug);
                }

                if (fieldErrors.doctor) {
                  setFieldErrors((prev) => ({ ...prev, doctor: "" }));
                }
              }}
              className={`${styles.select} ${fieldErrors.doctor ? styles.inputError : ""}`}
            >
              <option value="">Select a physician</option>
              {filteredDoctors.map((doc) => (
                <option key={doc.slug} value={doc.slug}>
                  {doc.fullName} ({doc.specialty})
                </option>
              ))}
            </select>
            {fieldErrors.doctor && (
              <span className={styles.fieldError}>{fieldErrors.doctor}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGrid}>
          {/* Appointment date */}
          <div className={styles.fieldGroup}>
            <label htmlFor="appointment-date" className={styles.label}>
              Appointment date <span className={styles.req}>*</span>
            </label>
            <input
              type="date"
              id="appointment-date"
              name="date"
              required
              disabled={isSubmitting}
              value={appointmentDate}
              onChange={(e) => {
                setAppointmentDate(e.target.value);
                setSelectedSlot(null);
                if (fieldErrors.date) {
                  setFieldErrors((prev) => ({ ...prev, date: "" }));
                }
              }}
              className={`${styles.input} ${fieldErrors.date ? styles.inputError : ""}`}
              min={todayIso}
            />
            {fieldErrors.date && (
              <span className={styles.fieldError}>{fieldErrors.date}</span>
            )}
          </div>

          {/* Available time slot */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Available time slot <span className={styles.req}>*</span>
            </label>

            {!doctor || !appointmentDate ? (
              <div className={styles.noSlotsNotice}>
                Please choose a physician and date above to load available times.
              </div>
            ) : isLoadingSlots ? (
              <div className={styles.slotsLoading}>
                Checking live availability with clinical scheduling…
              </div>
            ) : slotsError ? (
              <div className={styles.noSlotsNotice}>
                {slotsError}
              </div>
            ) : availableSlots.length === 0 && slotsFetched ? (
              <div className={styles.noSlotsNotice}>
                No available appointment times for this date. Please choose another date or physician.
              </div>
            ) : (
              <div className={styles.slotsWrapper}>
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.startsAt === slot.startsAt;
                  return (
                    <button
                      key={slot.startsAt}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setSelectedSlot(slot);
                        if (fieldErrors.slot) {
                          setFieldErrors((prev) => ({ ...prev, slot: "" }));
                        }
                      }}
                      className={`${styles.slotBtn} ${isSelected ? styles.slotActive : ""}`}
                      aria-pressed={isSelected}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}

            {fieldErrors.slot && (
              <span className={styles.fieldError}>{fieldErrors.slot}</span>
            )}
          </div>
        </div>

        {/* Reason for visit (optional) */}
        <div className={styles.fieldGroup}>
          <label htmlFor="appointment-reason" className={styles.label}>
            Reason for visit (optional)
          </label>
          <textarea
            id="appointment-reason"
            name="reason"
            rows={3}
            disabled={isSubmitting}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (fieldErrors.reason) {
                setFieldErrors((prev) => ({ ...prev, reason: "" }));
              }
            }}
            placeholder="Briefly state symptoms or clinical focus of your visit..."
            className={`${styles.textarea} ${fieldErrors.reason ? styles.inputError : ""}`}
          />
          {fieldErrors.reason && (
            <span className={styles.fieldError}>{fieldErrors.reason}</span>
          )}
        </div>

        <div className={styles.submitRow}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting || !selectedSlot}
          >
            {isSubmitting ? "Submitting Request…" : "Request Appointment"}
          </Button>
          {!selectedSlot && (
            <span className={styles.helperTip}>
              Please select a physician, date, and an available time slot above.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
