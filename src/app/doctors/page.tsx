import React from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/common/SectionHeading";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import styles from "./doctors.module.css";

export const metadata: Metadata = {
  title: "Find a Doctor",
  description: "Browse available doctor profiles by name, specialty, or department.",
};

export default function DoctorsDirectoryPage() {
  const { doctors, departments } = HOSPITAL_CONTENT;

  return (
    <PageContainer>
      <div className={styles.wrapper}>
        <SectionHeading
          eyebrow="MEDICAL DIRECTORY"
          tealPart="Find a"
          darkPart="Doctor"
          order="teal-first"
          subtitle="Browse available doctor profiles by name, specialty, or department."
        />

        {/* Directory Search & Filter Bar */}
        <div className={styles.searchBar}>
          <div className={styles.inputGroup}>
            <input
              type="search"
              placeholder="Search doctors or specialties"
              className={styles.searchInput}
              aria-label="Search doctors or specialties"
            />
          </div>

          <div className={styles.filterGroup}>
            <select className={styles.select} aria-label="Department">
              <option value="">Department: All</option>
              {departments.map((dept) => (
                <option key={dept.slug} value={dept.slug}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select className={styles.select} aria-label="Specialty">
              <option value="">Specialty: All</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.specialty}>
                  {doc.specialty}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className={styles.grid}>
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
    </PageContainer>
  );
}
