import React from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/common/SectionHeading";
import { DepartmentCard } from "@/components/departments/DepartmentCard";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import styles from "./departments.module.css";

export const metadata: Metadata = {
  title: "Departments & Services",
  description: "Find information about hospital departments and the services each department provides.",
};

export default function DepartmentsPage() {
  const { departments } = HOSPITAL_CONTENT;

  return (
    <PageContainer>
      <div className={styles.wrapper}>
        <SectionHeading
          eyebrow="SPECIALIZED CLINICAL CARE"
          tealPart="Explore Our"
          darkPart="Departments"
          order="teal-first"
          subtitle="Find information about hospital departments and the services each department provides."
        />

        <div className={styles.grid}>
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              id={dept.id}
              slug={dept.slug}
              name={dept.name}
              summary={dept.summary}
              serviceCount={dept.services.length}
            />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
