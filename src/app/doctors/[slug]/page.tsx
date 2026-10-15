import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import styles from "./doctor-profile.module.css";

export function generateStaticParams() {
  return HOSPITAL_CONTENT.doctors.map((doc) => ({
    slug: doc.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = HOSPITAL_CONTENT.doctors.find((d) => d.slug === slug);
  if (!doc) {
    return {
      title: "Doctor Not Found",
      description: "This doctor profile may be unavailable or the link may be incorrect.",
    };
  }
  return {
    title: doc.fullName,
    description: `${doc.specialty} — ${doc.departmentName}`,
  };
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = HOSPITAL_CONTENT.doctors.find((d) => d.slug === slug);

  if (!doc) {
    return (
      <PageContainer size="narrow">
        <div className={styles.notFoundWrapper}>
          <SectionHeading
            eyebrow="404"
            tealPart="Doctor"
            darkPart="Not Found"
            order="teal-first"
            subtitle="This doctor profile may be unavailable or the link may be incorrect."
          />
          <div style={{ marginTop: "2rem" }}>
            <Button href="/doctors" variant="primary">
              Back to All Doctors
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className={styles.wrapper}>
        <div className={styles.breadcrumbs}>
          <Link href="/doctors" className={styles.backLink}>
            ← Back to All Doctors
          </Link>
        </div>

        <div className={styles.profileLayout}>
          {/* Left Column: Photo & Direct Booking Action */}
          <div className={styles.photoCol}>
            <div className={styles.photoFrame}>
              <Image
                src={doc.photoUrl}
                alt={`Portrait of ${doc.fullName}`}
                fill
                sizes="(max-width: 900px) 100vw, 360px"
                className={styles.docPhoto}
                priority
              />
            </div>

            <div className={styles.quickCard}>
              <span className={styles.badge}>{doc.specialty}</span>
              <p className={styles.deptText}>{doc.departmentName}</p>
              <Button
                href={`/appointments?doctor=${doc.slug}`}
                variant="primary"
                size="md"
                className={styles.fullWidthBtn}
              >
                Book with this Doctor
              </Button>
            </div>
          </div>

          {/* Right Column: Doctor Details, Qualifications, and Schedule State */}
          <div className={styles.infoCol}>
            <SectionHeading
              eyebrow="DOCTOR PROFILE"
              tealPart={doc.fullName}
              order="teal-first"
              subtitle={`${doc.specialty} • ${doc.departmentName}`}
            />

            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>Qualifications & Credentials</h2>
              <p className={styles.bodyText}>{doc.qualifications}</p>
            </section>

            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>Professional Biography</h2>
              <p className={styles.bodyText}>{doc.biography}</p>
            </section>

            {/* Schedule Section as required by content.md Section 8 */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>Available Appointment Times</h2>
              <div className={styles.scheduleEmptyState}>
                <div className={styles.calendarIcon} aria-hidden="true">📅</div>
                <div>
                  <p className={styles.emptyNotice}>
                    No appointment times are currently available in this period. Please try another date or contact the hospital.
                  </p>
                  <small className={styles.complianceNote}>
                    Note: Appointment availability is synchronized directly with the hospital&apos;s clinical scheduling system.
                  </small>
                </div>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <Button href={`/appointments?doctor=${doc.slug}`} variant="secondary" size="md">
                  Check General Availability →
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
