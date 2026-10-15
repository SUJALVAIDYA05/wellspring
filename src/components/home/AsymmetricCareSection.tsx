import React from "react";
import Image from "next/image";
import { Button } from "@/components/common/Button";
import { SectionHeading } from "@/components/common/SectionHeading";
import styles from "./AsymmetricCareSection.module.css";

export function AsymmetricCareSection() {
  return (
    <section className={styles.section} aria-labelledby="intro-heading">
      <div className="container">
        <div className={styles.grid}>
          {/* Left Column: Asymmetric Layered Image Composition matching Page 2 */}
          <div className={styles.visualWrapper}>
            {/* Geometric Teal Backing Block */}
            <div className={styles.tealBlockBacking} aria-hidden="true" />

            {/* Main Consultation Photo (PDF Page 2) */}
            <div className={styles.mainImageCard}>
              <Image
                src="/images/elderly-care.jpg"
                alt="Doctor consulting with elderly patient in modern care setting"
                fill
                sizes="(max-width: 960px) 100vw, 420px"
                className={styles.mainImage}
              />
            </div>

            {/* Layered Circular Inset (PDF Page 2 doctor and family) */}
            <div className={styles.circleOverlay} aria-hidden="true">
              <Image
                src="/images/doctor-family.jpg"
                alt="Doctor with patient and family"
                fill
                sizes="160px"
                className={styles.circleImage}
              />
            </div>
          </div>

          {/* Right Column: Heading & Content */}
          <div className={styles.contentCol}>
            <SectionHeading
              eyebrow="COMMITTED TO EXCELLENCE"
              tealPart="Care Focused"
              darkPart="on You"
              order="teal-first"
              subtitle="Find information about our hospital, the services we offer, and how to arrange an appointment with our care team."
            />

            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Direct consultation with verified medical specialists</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Coordinated patient-first appointments without double-booking</span>
              </li>
              <li className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Dedicated emergency response guidance and triage support</span>
              </li>
            </ul>

            <Button href="/about" variant="secondary" size="md">
              About Our Hospital →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
