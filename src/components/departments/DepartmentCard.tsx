import React from "react";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import styles from "./DepartmentCard.module.css";

export interface DepartmentCardProps {
  id: string;
  slug: string;
  name: string;
  summary: string;
  serviceCount?: number;
  className?: string;
}

export function DepartmentCard({
  slug,
  name,
  summary,
  serviceCount,
  className = "",
}: DepartmentCardProps) {
  return (
    <article className={`${styles.card} ${className}`}>
      <div className={styles.iconWrapper} aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      </div>

      <h3 className={styles.name}>
        <Link href={`/departments/${slug}`}>{name}</Link>
      </h3>

      <p className={styles.summary}>{summary}</p>

      {serviceCount !== undefined && (
        <span style={{ fontSize: "0.8rem", color: "var(--color-teal-dark)", fontWeight: 600, marginBottom: "1rem" }}>
          {serviceCount} Services Available
        </span>
      )}

      <div className={styles.actions}>
        <Link href={`/departments/${slug}`} className={styles.link}>
          Explore Department →
        </Link>
        <Button href={`/appointments?department=${slug}`} variant="ghost" size="sm">
          Book →
        </Button>
      </div>
    </article>
  );
}
