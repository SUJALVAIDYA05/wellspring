import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/common/SectionHeading";
import { TealFeaturePanel } from "@/components/common/TealFeaturePanel";
import { Button } from "@/components/common/Button";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About Our Hospital",
  description: "Learn about our hospital, our approach to care, and the services available to patients and families.",
};

export default function AboutPage() {
  return (
    <PageContainer>
      <div className={styles.aboutWrapper}>
        {/* Editorial Header matching PDF Page 3 */}
        <section className={styles.heroRow}>
          <div className={styles.textSide}>
            <SectionHeading
              eyebrow="ABOUT OUR HOSPITAL"
              tealPart="Our Commitment"
              darkPart="to Care"
              order="teal-first"
              subtitle="Learn about our hospital, our approach to care, and the services available to patients and families."
            />
            <p className={styles.introParagraph}>
              We are dedicated to providing coordinated, high-quality clinical care with compassion,
              rigor, and respect for every patient and family. Our clinical team works across
              specialized departments to ensure seamless pathways from primary consultations to specialist care.
            </p>
            <div className={styles.actionButtons}>
              <Button href="/appointments" variant="primary" size="md">
                Book an Appointment
              </Button>
              <Button href="/doctors" variant="secondary" size="md">
                Meet Our Doctors
              </Button>
            </div>
          </div>

          <div className={styles.imageSide}>
            <div className={styles.tealAccentBacking} aria-hidden="true" />
            <div className={styles.imageFrame}>
              <Image
                src="/images/team-vision.jpg"
                alt="Healthcare leaders and clinical staff standing together"
                fill
                sizes="(max-width: 960px) 100vw, 480px"
                className={styles.heroImg}
                priority
              />
            </div>
          </div>
        </section>

        {/* Core Pillars matching PDF Page 5 Feature Panels with numbered circles */}
        <section className={styles.pillarsSection} aria-labelledby="pillars-heading">
          <SectionHeading
            eyebrow="CORE FOUNDATIONS"
            tealPart="Guiding"
            darkPart="Principles"
            align="center"
            subtitle="The fundamental standards shaping our hospital practice and patient experience."
          />

          <div className={styles.pillarsGrid}>
            <TealFeaturePanel
              badgeNumber="1"
              title="Hospital Mission"
              body="[HOSPITAL-APPROVED MISSION STATEMENT — PROVIDE]"
            />
            <TealFeaturePanel
              badgeNumber="2"
              title="Hospital Vision"
              body="[HOSPITAL-APPROVED VISION STATEMENT — PROVIDE]"
            />
            <TealFeaturePanel
              badgeNumber="3"
              title="History & Heritage"
              body="[VERIFIED HOSPITAL HISTORY — PROVIDE]"
            />
          </div>
        </section>

        {/* Facilities & Quality Commitment */}
        <section className={styles.facilitySection}>
          <div className={styles.facilityCard}>
            <h3 className={styles.cardTitle}>Facilities & Accreditations</h3>
            <p className={styles.cardBody}>
              [VERIFIED DETAILS ONLY — PROVIDE]
            </p>
            <div className={styles.noteBox}>
              <small>
                Note: In accordance with our hospital content policy, measurable claims, specific facility certifications,
                and accreditations are verified before publication.
              </small>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
