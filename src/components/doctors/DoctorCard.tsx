import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import styles from "./DoctorCard.module.css";

export interface DoctorCardProps {
  id: string;
  slug: string;
  fullName: string;
  specialty: string;
  departmentName?: string;
  photoUrl?: string;
  className?: string;
}

export function DoctorCard({
  slug,
  fullName,
  specialty,
  departmentName,
  photoUrl = "/images/hero-doctor.jpg",
  className = "",
}: DoctorCardProps) {
  return (
    <article className={`${styles.card} ${className}`}>
      <div className={styles.imageWrapper}>
        <Image
          src={photoUrl}
          alt={`Portrait of ${fullName}`}
          width={300}
          height={240}
          className={styles.image}
        />
      </div>

      <div className={styles.content}>
        <span className={styles.specialtyBadge}>{specialty}</span>
        <h3 className={styles.name}>
          <Link href={`/doctors/${slug}`}>{fullName}</Link>
        </h3>
        {departmentName && <p className={styles.department}>{departmentName}</p>}

        <div className={styles.actions}>
          <Button href={`/appointments?doctor=${slug}`} variant="primary" size="sm">
            Book Appointment
          </Button>
          <Button href={`/doctors/${slug}`} variant="ghost" size="sm">
            Profile →
          </Button>
        </div>
      </div>
    </article>
  );
}
