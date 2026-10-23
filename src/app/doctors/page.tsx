import React from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/common/SectionHeading";
import {
  DoctorsDirectoryClient,
  DirectoryDoctor,
  DirectoryDepartment,
} from "./DoctorsDirectoryClient";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import { prisma } from "@/lib/db";
import styles from "./doctors.module.css";

export const metadata: Metadata = {
  title: "Find a Doctor",
  description: "Browse available doctor profiles by name, specialty, or department.",
};

export const instant = false;

export default async function DoctorsDirectoryPage() {
  let doctors: DirectoryDoctor[] = [];
  let departments: DirectoryDepartment[] = [];

  try {
    const [dbDoctors, dbDepartments] = await Promise.all([
      prisma.doctor.findMany({
        where: { isActive: true },
        include: { department: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.department.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);

    doctors = dbDoctors.map((doc) => ({
      id: doc.id,
      slug: doc.slug,
      fullName: doc.fullName,
      specialty: doc.specialty,
      departmentSlug: doc.department?.slug,
      departmentName: doc.department?.name,
      photoUrl: doc.photoUrl || "/images/hero-doctor.jpg",
    }));

    departments = dbDepartments.map((dept) => ({
      id: dept.id,
      slug: dept.slug,
      name: dept.name,
    }));
  } catch {
    doctors = HOSPITAL_CONTENT.doctors.map((doc) => ({
      id: doc.id,
      slug: doc.slug,
      fullName: doc.fullName,
      specialty: doc.specialty,
      departmentSlug: doc.departmentSlug,
      departmentName: doc.departmentName,
      photoUrl: doc.photoUrl,
    }));

    departments = HOSPITAL_CONTENT.departments.map((dept) => ({
      id: dept.id,
      slug: dept.slug,
      name: dept.name,
    }));
  }

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

        <DoctorsDirectoryClient
          initialDoctors={doctors}
          departments={departments}
        />
      </div>
    </PageContainer>
  );
}
