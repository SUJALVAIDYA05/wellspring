"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import { Button } from "@/components/common/Button";
import styles from "./appointments.module.css";

export function AppointmentBookingForm() {
  const searchParams = useSearchParams();
  const initialDept = searchParams.get("department") || "";
  const initialDoctor = searchParams.get("doctor") || "";

  const [department, setDepartment] = useState(initialDept);
  const [doctor, setDoctor] = useState(initialDoctor);
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");

  const [formStatus, setFormStatus] = useState<"idle" | "notice">("idle");

  const { departments, doctors } = HOSPITAL_CONTENT;

  // Filter doctors when department changes
  const filteredDoctors = department
    ? doctors.filter((d) => d.departmentSlug === department)
    : doctors;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In accordance with guidelines: Do not pretend a fake booking succeeded.
    // Display clear non-production developer/system status.
    setFormStatus("notice");
  };

  const sampleAvailableSlots = [
    "09:00 AM",
    "10:15 AM",
    "11:30 AM",
    "02:00 PM",
    "03:45 PM",
  ];

  return (
    <div className={styles.formContainer}>
      {/* Notice Banner: Transparent compliance with non-production booking constraint */}
      <div className={styles.systemNotice} role="status">
        <span className={styles.noticeTag}>API Integration Notice</span>
        <p>
          Appointment scheduling frontend layout ready. Live appointment slots and concurrency-safe
          booking will be processed directly by the backend database service.
        </p>
      </div>

      {formStatus === "notice" && (
        <div className={styles.submissionAlert} role="alert">
          <strong>Request Captured (Frontend Validation Passed)</strong>
          <p>
            The appointment form fields have been validated. In this frontend foundation phase,
            submissions are not dispatched to production until backend database contracts are linked.
          </p>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
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
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Full name of patient"
              className={styles.input}
            />
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 555-0123"
              className={styles.input}
            />
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="patient@example.com"
            className={styles.input}
          />
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
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setDoctor(""); // Reset doctor if department changed
              }}
              className={styles.select}
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.slug} value={dept.slug}>
                  {dept.name}
                </option>
              ))}
            </select>
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
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className={styles.select}
            >
              <option value="">Select a physician</option>
              {filteredDoctors.map((doc) => (
                <option key={doc.slug} value={doc.slug}>
                  {doc.fullName} ({doc.specialty})
                </option>
              ))}
            </select>
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
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className={styles.input}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Available time slot */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Available time <span className={styles.req}>*</span>
            </label>
            <div className={styles.slotsWrapper}>
              {sampleAvailableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`${styles.slotBtn} ${selectedSlot === slot ? styles.slotActive : ""}`}
                  aria-pressed={selectedSlot === slot}
                >
                  {slot}
                </button>
              ))}
            </div>
            <input type="hidden" name="timeSlot" value={selectedSlot} required />
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
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly state symptoms or clinical focus of your visit..."
            className={styles.textarea}
          />
        </div>

        <div className={styles.submitRow}>
          <Button type="submit" variant="primary" size="lg" disabled={!selectedSlot}>
            Request Appointment
          </Button>
          {!selectedSlot && (
            <span className={styles.helperTip}>Please select an available time slot above.</span>
          )}
        </div>
      </form>
    </div>
  );
}
