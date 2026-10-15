import React from "react";
import Link from "next/link";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import styles from "./EmergencyBanner.module.css";

export function EmergencyBanner() {
  const { emergencySection, contact } = HOSPITAL_CONTENT;

  return (
    <aside className={styles.banner} aria-label="Immediate Emergency Warning">
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <div className={styles.alertIcon} aria-hidden="true">
            !
          </div>
          <div>
            <h3 className={styles.heading}>{emergencySection.heading}</h3>
            <p className={styles.body}>{emergencySection.body}</p>
          </div>
        </div>

        <div className={styles.actionArea}>
          <a
            href={
              contact.emergencyPhone.startsWith("[")
                ? "/emergency"
                : `tel:${contact.emergencyPhone}`
            }
            className={styles.phoneLink}
            aria-label={`Emergency phone: ${contact.emergencyPhone}`}
          >
            <span>Call: {contact.emergencyPhone}</span>
          </a>
          <Link
            href="/emergency"
            style={{
              color: "var(--color-emergency)",
              fontWeight: 700,
              fontSize: "0.875rem",
              textDecoration: "underline",
              whiteSpace: "nowrap",
            }}
          >
            Emergency Instructions →
          </Link>
        </div>
      </div>
    </aside>
  );
}
