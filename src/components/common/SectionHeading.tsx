import React from "react";
import styles from "./SectionHeading.module.css";

export interface SectionHeadingProps {
  eyebrow?: string;
  tealPart?: string;
  darkPart?: string;
  order?: "teal-first" | "dark-first";
  subtitle?: string;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  tealPart,
  darkPart,
  order = "teal-first",
  subtitle,
  align = "left",
  as: Component = "h2",
  className = "",
}: SectionHeadingProps) {
  return (
    <div
      className={`${styles.headingWrapper} ${styles[`align-${align}`]} ${className}`}
    >
      {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
      <Component className={styles.title}>
        {order === "teal-first" ? (
          <>
            {tealPart && <span className={styles.partTeal}>{tealPart} </span>}
            {darkPart && <span className={styles.partDark}>{darkPart}</span>}
          </>
        ) : (
          <>
            {darkPart && <span className={styles.partDark}>{darkPart} </span>}
            {tealPart && <span className={styles.partTeal}>{tealPart}</span>}
          </>
        )}
      </Component>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
