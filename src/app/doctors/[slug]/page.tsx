import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import { prisma } from "@/lib/db";
import styles from "./doctor-profile.module.css";

export const instant = false;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function generateStaticParams() {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    if (doctors.length > 0) {
      return doctors.map((doc) => ({ slug: doc.slug }));
    }
  } catch {
    // fallback
  }
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
  try {
    const doc = await prisma.doctor.findFirst({
      where: { slug, isActive: true },
      include: { department: true },
    });
    if (doc) {
      return {
        title: doc.fullName,
        description: `${doc.specialty} — ${doc.department?.name || "General Medicine"}`,
      };
    }
  } catch {
    // fallback
  }

  const fallbackDoc = HOSPITAL_CONTENT.doctors.find((d) => d.slug === slug);
  if (!fallbackDoc) {
    return {
      title: "Doctor Not Found",
      description: "This doctor profile may be unavailable or the link may be incorrect.",
    };
  }
  return {
    title: fallbackDoc.fullName,
    description: `${fallbackDoc.specialty} — ${fallbackDoc.departmentName}`,
  };
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let doc: {
    id: string;
    slug: string;
    fullName: string;
    specialty: string;
    departmentName: string;
    qualifications: string;
    biography: string;
    photoUrl: string;
    schedules: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotDurationMinutes: number;
    }[];
  } | null = null;

  try {
    const dbDoc = await prisma.doctor.findFirst({
      where: { slug },
      include: {
        department: true,
        schedules: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
      },
    });

    // Explicitly handle inactive or missing doctors safely
    if (dbDoc && dbDoc.isActive) {
      doc = {
        id: dbDoc.id,
        slug: dbDoc.slug,
        fullName: dbDoc.fullName,
        specialty: dbDoc.specialty,
        departmentName: dbDoc.department?.name || "General Medicine",
        qualifications: Array.isArray(dbDoc.qualifications)
          ? dbDoc.qualifications.join(", ")
          : dbDoc.qualifications,
        biography:
          dbDoc.biography ||
          "Clinical healthcare practitioner committed to exceptional patient care and diagnostic rigor.",
        photoUrl: dbDoc.photoUrl || "/images/hero-doctor.jpg",
        schedules: dbDoc.schedules,
      };
    }
  } catch {
    const fallback = HOSPITAL_CONTENT.doctors.find((d) => d.slug === slug);
    if (fallback) {
      doc = {
        id: fallback.id,
        slug: fallback.slug,
        fullName: fallback.fullName,
        specialty: fallback.specialty,
        departmentName: fallback.departmentName,
        qualifications: fallback.qualifications,
        biography: fallback.biography,
        photoUrl: fallback.photoUrl,
        schedules: [],
      };
    }
  }

  // Handle unavailable or inactive doctors safely with 404 state
  if (!doc) {
    return (
      <PageContainer size="narrow">
        <div className={styles.notFoundWrapper}>
          <SectionHeading
            eyebrow="404"
            tealPart="Doctor"
            darkPart="Unavailable"
            order="teal-first"
            subtitle="This physician profile is not currently available or the link may be incorrect."
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

            {/* Schedule Section */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>Available Appointment Times</h2>

              {doc.schedules.length > 0 ? (
                <div className={styles.scheduleList}>
                  <p className={styles.scheduleIntro}>
                    Regular Clinic Hours (synchronized with live booking availability):
                  </p>
                  <ul className={styles.scheduleDays}>
                    {doc.schedules.map((s, idx) => (
                      <li key={idx} className={styles.scheduleRow}>
                        <span className={styles.scheduleDay}>{DAYS[s.dayOfWeek]}</span>
                        <span className={styles.scheduleTime}>
                          {s.startTime} – {s.endTime} ({s.slotDurationMinutes} min slots)
                        </span>
                      </li>
                    ))}
                  </ul>
                  <small className={styles.complianceNote} style={{ marginTop: "1rem" }}>
                    Note: Appointment availability is synchronized directly with the hospital&apos;s
                    clinical scheduling system.
                  </small>
                </div>
              ) : (
                <div className={styles.scheduleEmptyState}>
                  <div className={styles.calendarIcon} aria-hidden="true">
                    📅
                  </div>
                  <div>
                    <p className={styles.emptyNotice}>
                      No fixed routine hours posted. Please check live availability dates in the booking
                      system or contact the hospital.
                    </p>
                    <small className={styles.complianceNote}>
                      Note: Appointment availability is synchronized directly with the hospital&apos;s
                      clinical scheduling system.
                    </small>
                  </div>
                </div>
              )}

              <div style={{ marginTop: "1.5rem" }}>
                <Button href={`/appointments?doctor=${doc.slug}`} variant="secondary" size="md">
                  Check Live Availability & Book →
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
