import React from "react";
import Image from "next/image";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import { Button } from "@/components/common/Button";
import styles from "./HeroSection.module.css";

export function HeroSection() {
  const { hero, contact } = HOSPITAL_CONTENT;

  return (
    <section className={styles.heroSection} aria-labelledby="hero-heading">
      <div className="container">
        <div className={styles.heroGrid}>
          {/* Left Column: Headlines & Actions */}
          <div className={styles.contentCol}>
            <span className={styles.eyebrow}>{hero.eyebrow}</span>
            <h1 id="hero-heading" className={styles.headline}>
              <span className={styles.tealWord}>{hero.headlinePart1}</span>
              <span className={styles.darkWord}>{hero.headlinePart2}</span>
            </h1>
            <p className={styles.supportingText}>{hero.supportingText}</p>

            <div className={styles.ctaGroup}>
              <Button href="/appointments" variant="primary" size="lg">
                Book an Appointment
              </Button>
              <Button href="/doctors" variant="secondary" size="lg">
                Find a Doctor
              </Button>
            </div>
          </div>

          {/* Right Column: Reference Design Doctor Portrait & Teal Oval */}
          <div className={styles.imageCol}>
            <div className={styles.tealCircleBackdrop} aria-hidden="true" />
            <div className={styles.doctorImageWrapper}>
              <Image
                src="/images/hero-doctor-cutout.png"
                alt="Clinical care professional with clipboard and stethoscope"
                width={420}
                height={480}
                priority
                className={styles.doctorImage}
              />
            </div>
          </div>
        </div>

        {/* Page 1 Bottom Teal Contact Strip */}
        <div className={styles.contactStrip}>
          <div className={styles.contactStripInner}>
            <div className={styles.contactItem}>
              <svg
                className={styles.icon}
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
            </div>

            <div className={styles.contactItem}>
              <svg
                className={styles.icon}
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
            </div>

            <div className={styles.contactItem}>
              <svg
                className={styles.icon}
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
