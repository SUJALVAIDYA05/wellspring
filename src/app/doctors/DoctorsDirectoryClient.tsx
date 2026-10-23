"use client";

import React, { useState, useMemo } from "react";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import styles from "./doctors.module.css";

export interface DirectoryDoctor {
  id: string;
  slug: string;
  fullName: string;
  specialty: string;
  departmentSlug?: string;
  departmentName?: string;
  photoUrl?: string;
}

export interface DirectoryDepartment {
  id: string;
  slug: string;
  name: string;
}

interface Props {
  initialDoctors: DirectoryDoctor[];
  departments: DirectoryDepartment[];
}

export function DoctorsDirectoryClient({ initialDoctors, departments }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  // Unique specialties
  const specialties = useMemo(() => {
    const set = new Set<string>();
    initialDoctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set).sort();
  }, [initialDoctors]);

  const filteredDoctors = useMemo(() => {
    return initialDoctors.filter((doc) => {
      // Search term (case-insensitive)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = doc.fullName.toLowerCase().includes(q);
        const matchesSpec = doc.specialty.toLowerCase().includes(q);
        if (!matchesName && !matchesSpec) return false;
      }

      // Department filter
      if (selectedDepartment) {
        if (doc.departmentSlug !== selectedDepartment) return false;
      }

      // Specialty filter
      if (selectedSpecialty) {
        if (doc.specialty !== selectedSpecialty) return false;
      }

      return true;
    });
  }, [initialDoctors, searchTerm, selectedDepartment, selectedSpecialty]);

  return (
    <>
      {/* Directory Search & Filter Bar */}
      <div className={styles.searchBar}>
        <div className={styles.inputGroup}>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search doctors or specialties"
            className={styles.searchInput}
            aria-label="Search doctors or specialties"
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            className={styles.select}
            aria-label="Department"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">Department: All</option>
            {departments.map((dept) => (
              <option key={dept.slug} value={dept.slug}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            aria-label="Specialty"
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
          >
            <option value="">Specialty: All</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No physicians found matching your search. Please adjust your filters or search term.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredDoctors.map((doc) => (
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
      )}
    </>
  );
}
