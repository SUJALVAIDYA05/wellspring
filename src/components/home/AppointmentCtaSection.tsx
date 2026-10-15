import React from "react";
import Image from "next/image";
import Link from "next/link";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import styles from "./AppointmentCtaSection.module.css";

export function AppointmentCtaSection() {
  const { ctas } = HOSPITAL_CONTENT;

  return (
    <section className={styles.section} aria-labelledby="cta-heading">
      <div className="container">
        <div className={styles.bannerCard}>
          <div className={styles.bgCircle} aria-hidden="true" />

          {/* Left: Heading and Call to Action */}
          <div className={styles.content}>
            <span className={styles.eyebrow}>CONVENIENT SCHEDULING</span>
            <h2 id="cta-heading" className={styles.headline}>
              Plan Your Visit
            </h2>
            <p className={styles.body}>
              Request an appointment and choose a doctor and available time that suit your
              needs. Our team ensures coordinated clinical care every step of the way.
            </p>

            <div className={styles.actions}>
              <Link href="/appointments" className={styles.whiteButton}>
                {ctas.primary}
              </Link>
              <Link href="/doctors" className={styles.outlineButton}>
                {ctas.secondary}
              </Link>
            </div>
          </div>

          {/* Right: Circular Photo echoing reference Page 10 */}
          <div className={styles.graphicCol}>
            <div className={styles.circlePhotoWrapper}>
              <Image
                src="/images/hero-doctor.jpg"
                alt="Doctor portrait"
                width={260}
                height={260}
                className={styles.photo}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
