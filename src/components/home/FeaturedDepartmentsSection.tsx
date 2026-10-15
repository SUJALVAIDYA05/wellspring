import React from "react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import styles from "./FeaturedDepartmentsSection.module.css";

export function FeaturedDepartmentsSection() {
  const { departments } = HOSPITAL_CONTENT;

  const departmentIcons = [
    <svg key="1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>,
    <svg key="2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>,
    <svg key="3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>,
  ];

  return (
    <section className={styles.section} aria-labelledby="departments-heading">
      <div className="container">
        {/* Header row matching Page 4 */}
        <div className={styles.headerRow}>
          <SectionHeading
            eyebrow="SPECIALIZED CARE"
            tealPart="Departments &"
            darkPart="Services"
            order="teal-first"
            subtitle="Explore the departments and services available at our hospital."
          />
          <Button href="/departments" variant="secondary" size="md">
            View All Departments →
          </Button>
        </div>

        {/* Clinical Image Banner matching Page 4 top right */}
        <div className={styles.wideBannerWrapper}>
          <div className={styles.tealBannerTab} aria-hidden="true" />
          <Image
            src="/images/medical-team.jpg"
            alt="Clinical doctors discussing patient care in hospital corridor"
            width={1200}
            height={260}
            className={styles.bannerImage}
          />
        </div>

        {/* Three Aligned Teal Information Panels matching Page 4 */}
        <div className={styles.panelsGrid}>
          {departments.slice(0, 3).map((dept, index) => (
            <div key={dept.slug} className={styles.panelItem}>
              <h3 className={styles.panelTitle}>{dept.name}</h3>
              <p className={styles.panelBody}>{dept.summary}</p>
              <div className={styles.iconTag} aria-hidden="true">
                {departmentIcons[index] || departmentIcons[0]}
              </div>
              <Link href={`/departments/${dept.slug}`} className={styles.panelLink}>
                Learn More →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
