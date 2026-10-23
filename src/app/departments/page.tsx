import React from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/common/SectionHeading";
import { DepartmentCard } from "@/components/departments/DepartmentCard";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import { prisma } from "@/lib/db";
import styles from "./departments.module.css";

export const metadata: Metadata = {
  title: "Departments & Services",
  description: "Find information about hospital departments and the services each department provides.",
};

export const instant = false;

export default async function DepartmentsPage() {
  let departments: {
    id: string;
    slug: string;
    name: string;
    summary: string;
    serviceCount: number;
  }[] = [];

  try {
    const dbDepts = await prisma.department.findMany({
      where: { isActive: true },
      include: {
        services: { where: { isActive: true } },
      },
      orderBy: { name: "asc" },
    });

    if (dbDepts.length > 0) {
      departments = dbDepts.map((d) => ({
        id: d.id,
        slug: d.slug,
        name: d.name,
        summary: d.summary,
        serviceCount: d.services.length,
      }));
    } else {
      throw new Error("No departments in DB");
    }
  } catch {
    departments = HOSPITAL_CONTENT.departments.map((dept) => ({
      id: dept.id,
      slug: dept.slug,
      name: dept.name,
      summary: dept.summary,
      serviceCount: dept.services.length,
    }));
  }

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
              serviceCount={dept.serviceCount}
            />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
