import React from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/common/Button";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import styles from "./emergency.module.css";

export const metadata: Metadata = {
  title: "Emergency Services",
  description:
    "Critical guidance and contact instructions for life-threatening emergencies. Do not wait for an online response.",
};

export default function EmergencyPage() {
  const { contact } = HOSPITAL_CONTENT;

  return (
    <PageContainer size="narrow">
      <div className={styles.wrapper}>
        {/* Prominent Emergency Warning Card */}
        <div className={styles.alertHeader}>
          <div className={styles.warningPill}>IMMEDIATE ACTION REQUIRED</div>
          <h1 className={styles.mainTitle}>Emergency Services</h1>
          <p className={styles.leadWarning}>
            If you or someone nearby is experiencing a life-threatening emergency, contact your
            local emergency service or go to the nearest emergency department immediately.
            <strong> Do not wait for a website response or book a routine appointment.</strong>
          </p>
        </div>

        {/* Emergency Contact Information Block */}
        <div className={styles.contactCard}>
          <div className={styles.cardHeader}>
            <span className={styles.sirenIcon} aria-hidden="true">🚨</span>
            <div>
              <h2 className={styles.cardHeading}>Emergency Contact Details</h2>
              <p className={styles.cardSub}>Direct emergency line and arrival location</p>
            </div>
          </div>

          <div className={styles.detailList}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Emergency phone</span>
              <div className={styles.valueGroup}>
                <a
                  href={contact.emergencyPhone.startsWith("[") ? "#" : `tel:${contact.emergencyPhone}`}
                  className={styles.telLink}
                >
                  {contact.emergencyPhone}
                </a>
                <small className={styles.subNote}>
                  Required before launch. Call local emergency numbers if unavailable.
                </small>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>Hospital emergency department</span>
              <p className={styles.valText}>{contact.emergencyAddress}</p>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>Service Availability</span>
              <p className={styles.valText}>{contact.emergencyHours}</p>
            </div>
          </div>
        </div>

        {/* Directions & Arrival Advice */}
        <div className={styles.directionsCard}>
          <h3 className={styles.directionsHeading}>How to Reach Us</h3>
          <p className={styles.directionsBody}>
            [VERIFIED DIRECTIONS — OPTIONAL]
          </p>
          <ul className={styles.adviceList}>
            <li>Proceed directly to the Emergency Entrance clearly marked with red signage.</li>
            <li>Triage staff are stationed at the entry door to evaluate patients immediately.</li>
            <li>Bring any regular medications and emergency identification if safely feasible.</li>
          </ul>
        </div>

        {/* Distinction with Routine Care */}
        <div className={styles.routineNotice}>
          <h4>Looking for Non-Emergency Consultations?</h4>
          <p>
            For scheduled care, routine check-ups, and planned clinical appointments, use our standard booking portal.
          </p>
          <div className={styles.actionRow}>
            <Button href="/appointments" variant="secondary" size="md">
              Book a Routine Appointment
            </Button>
            <Button href="/doctors" variant="ghost" size="md">
              Find a Specialist →
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
