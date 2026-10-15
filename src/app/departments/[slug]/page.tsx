import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import styles from "./dept-detail.module.css";

export function generateStaticParams() {
  return HOSPITAL_CONTENT.departments.map((dept) => ({
    slug: dept.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dept = HOSPITAL_CONTENT.departments.find((d) => d.slug === slug);
  if (!dept) {
    return {
      title: "Department Not Found",
      description: "This department may be unavailable or the link may be incorrect.",
    };
  }
  return {
    title: dept.name,
    description: dept.summary,
  };
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dept = HOSPITAL_CONTENT.departments.find((d) => d.slug === slug);

  if (!dept) {
    return (
      <PageContainer size="narrow">
        <div className={styles.notFoundWrapper}>
          <SectionHeading
            eyebrow="404"
            tealPart="Department"
            darkPart="Not Found"
            order="teal-first"
            subtitle="This department may be unavailable or the link may be incorrect."
          />
          <div style={{ marginTop: "2rem" }}>
            <Button href="/departments" variant="primary">
              ← Back to All Departments
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Find linked doctors for this department
  const relatedDoctors = HOSPITAL_CONTENT.doctors.filter(
    (doc) => doc.departmentSlug === dept.slug
  );

  return (
    <PageContainer>
      <div className={styles.wrapper}>
        <div className={styles.breadcrumbs}>
          <Link href="/departments" className={styles.backLink}>
            ← All Departments
          </Link>
        </div>

        <SectionHeading
          eyebrow="DEPARTMENT DETAILS"
          tealPart={dept.name}
          order="teal-first"
          subtitle={dept.summary}
        />

        <div className={styles.contentGrid}>
          <div className={styles.mainCol}>
            <section className={styles.sectionBlock}>
              <h2 className={styles.subHeading}>Overview</h2>
              <p className={styles.bodyText}>{dept.description}</p>
            </section>

            <section className={styles.sectionBlock}>
              <h2 className={styles.subHeading}>Services</h2>
              <ul className={styles.serviceList}>
                {dept.services.map((service, idx) => (
                  <li key={idx} className={styles.serviceItem}>
                    <span className={styles.check} aria-hidden="true">✓</span>
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.sectionBlock}>
              <h2 className={styles.subHeading}>Doctors in This Department</h2>
              {relatedDoctors.length > 0 ? (
                <div className={styles.doctorList}>
                  {relatedDoctors.map((doc) => (
                    <div key={doc.slug} className={styles.doctorCard}>
                      <div>
                        <h3 className={styles.docName}>{doc.fullName}</h3>
                        <p className={styles.docTitle}>{doc.specialty}</p>
                      </div>
                      <Button href={`/doctors/${doc.slug}`} variant="secondary" size="sm">
                        View Profile →
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.mutedText}>
                  Physician profiles for this department are undergoing verification.
                </p>
              )}
            </section>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.ctaBox}>
              <h3>Arrange a Consultation</h3>
              <p>Request an appointment with physicians in this department.</p>
              <Button
                href={`/appointments?department=${dept.slug}`}
                variant="primary"
                size="md"
                className={styles.bookBtn}
              >
                Book an Appointment
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </PageContainer>
  );
}
