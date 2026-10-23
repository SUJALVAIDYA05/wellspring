import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import { prisma } from "@/lib/db";
import styles from "./dept-detail.module.css";

export const instant = false;

export async function generateStaticParams() {
  try {
    const depts = await prisma.department.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    if (depts.length > 0) {
      return depts.map((dept) => ({ slug: dept.slug }));
    }
  } catch {}
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
  try {
    const dept = await prisma.department.findFirst({
      where: { slug, isActive: true },
    });
    if (dept) {
      return {
        title: dept.name,
        description: dept.summary,
      };
    }
  } catch {}

  const fallback = HOSPITAL_CONTENT.departments.find((d) => d.slug === slug);
  if (!fallback) {
    return {
      title: "Department Not Found",
      description: "This department may be unavailable or the link may be incorrect.",
    };
  }
  return {
    title: fallback.name,
    description: fallback.summary,
  };
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let dept: {
    id: string;
    slug: string;
    name: string;
    summary: string;
    description: string;
    services: string[];
    doctors: {
      id: string;
      slug: string;
      fullName: string;
      specialty: string;
    }[];
  } | null = null;

  try {
    const dbDept = await prisma.department.findFirst({
      where: { slug, isActive: true },
      include: {
        services: { where: { isActive: true }, orderBy: { name: "asc" } },
        doctors: { where: { isActive: true }, orderBy: { fullName: "asc" } },
      },
    });

    if (dbDept) {
      dept = {
        id: dbDept.id,
        slug: dbDept.slug,
        name: dbDept.name,
        summary: dbDept.summary,
        description: dbDept.description,
        services: dbDept.services.map((s) => s.name),
        doctors: dbDept.doctors.map((d) => ({
          id: d.id,
          slug: d.slug,
          fullName: d.fullName,
          specialty: d.specialty,
        })),
      };
    }
  } catch {
    const fallback = HOSPITAL_CONTENT.departments.find((d) => d.slug === slug);
    if (fallback) {
      const fallbackDocs = HOSPITAL_CONTENT.doctors
        .filter((d) => d.departmentSlug === fallback.slug)
        .map((d) => ({
          id: d.id,
          slug: d.slug,
          fullName: d.fullName,
          specialty: d.specialty,
        }));

      dept = {
        id: fallback.id,
        slug: fallback.slug,
        name: fallback.name,
        summary: fallback.summary,
        description: fallback.description,
        services: fallback.services,
        doctors: fallbackDocs,
      };
    }
  }

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
              {dept.services.length > 0 ? (
                <ul className={styles.serviceList}>
                  {dept.services.map((service, idx) => (
                    <li key={idx} className={styles.serviceItem}>
                      <span className={styles.check} aria-hidden="true">
                        ✓
                      </span>
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.mutedText}>
                  Services for this department are being updated.
                </p>
              )}
            </section>

            <section className={styles.sectionBlock}>
              <h2 className={styles.subHeading}>Doctors in This Department</h2>
              {dept.doctors.length > 0 ? (
                <div className={styles.doctorList}>
                  {dept.doctors.map((doc) => (
                    <div key={doc.slug} className={styles.doctorCard}>
                      <div>
                        <h3 className={styles.docName}>{doc.fullName}</h3>
                        <p className={styles.docTitle}>{doc.specialty}</p>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button href={`/appointments?doctor=${doc.slug}`} variant="primary" size="sm">
                          Book
                        </Button>
                        <Button href={`/doctors/${doc.slug}`} variant="secondary" size="sm">
                          Profile →
                        </Button>
                      </div>
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
