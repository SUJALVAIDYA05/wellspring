import React from "react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import styles from "./FeaturedDoctorsSection.module.css";

export function FeaturedDoctorsSection() {
  const { doctors } = HOSPITAL_CONTENT;

  return (
    <section className={styles.section} aria-labelledby="doctors-heading">
      <div className="container">
        <div className={styles.headerRow}>
          <SectionHeading
            eyebrow="CLINICAL EXCELLENCE"
            tealPart="Meet Our"
            darkPart="Doctors"
            order="teal-first"
            subtitle="Explore doctor profiles and find the right appointment option for your needs."
          />
          <Button href="/doctors" variant="secondary" size="md">
            View All Doctors →
          </Button>
        </div>

        <div className={styles.doctorsGrid}>
          {doctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              id={doc.id}
              slug={doc.slug}
              fullName={doc.fullName}
              specialty={doc.specialty}
              departmentName={doc.departmentName}
              photoUrl={doc.photoUrl}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
