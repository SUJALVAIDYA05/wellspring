import React from "react";
import Link from "next/link";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import { HospitalLogo } from "@/components/common/HospitalLogo";
import { CopyrightYear } from "@/components/common/CopyrightYear";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  const { meta, navigation, contact, emergencySection } = HOSPITAL_CONTENT;

  return (
    <footer className={styles.footer}>
      {/* Reference Design Teal Contact Strip */}
      <div className={styles.contactStrip}>
        <div className={`container ${styles.contactStripInner}`}>
          {/* Phone */}
          <a
            href={contact.phone.startsWith("[") ? "#" : `tel:${contact.phone}`}
            className={styles.contactItem}
            aria-label={`Hospital Phone: ${contact.phone}`}
          >
            <svg
              className={styles.contactIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{contact.phone}</span>
          </a>

          {/* Email */}
          <a
            href={contact.email.startsWith("[") ? "#" : `mailto:${contact.email}`}
            className={styles.contactItem}
            aria-label={`Hospital Email: ${contact.email}`}
          >
            <svg
              className={styles.contactIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>{contact.email}</span>
          </a>

          {/* Address / Location */}
          <span className={styles.contactItem}>
            <svg
              className={styles.contactIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{contact.address}</span>
          </span>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className={`container ${styles.mainFooter}`}>
        <div className={styles.grid}>
          {/* Brand Column */}
          <div className={styles.colBrand}>
            <Link href="/" className={styles.brandLink}>
              <HospitalLogo className={styles.brandLogo} size={44} />
              <span className={styles.brandName}>{meta.hospitalName}</span>
            </Link>
            <p className={styles.brandDesc}>{meta.tagline}</p>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className={styles.colTitle}>Quick Links</h4>
            <ul className={styles.linkList}>
              {navigation.main.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.footerLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/staff/login" className={styles.footerLink}>
                  Staff Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency Notice */}
          <div>
            <h4 className={styles.colTitle}>Emergency Care</h4>
            <div className={styles.emergencyCallout}>
              <strong>{emergencySection.heading}</strong>
              <p>{emergencySection.body}</p>
              <p style={{ marginTop: "0.5rem" }}>
                <Link href="/emergency">View Emergency Instructions →</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div>
            © <CopyrightYear /> {meta.hospitalName}. All rights reserved.
          </div>
          <div>
            Visual styling derived from reference presentation. Content governed by content.md.
          </div>
        </div>
      </div>
    </footer>
  );
}
