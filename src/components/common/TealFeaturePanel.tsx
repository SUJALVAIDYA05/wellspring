import React from "react";
import styles from "./TealFeaturePanel.module.css";

export interface TealFeaturePanelProps {
  title: string;
  body: string;
  badgeNumber?: number | string;
  icon?: React.ReactNode;
  className?: string;
}

export function TealFeaturePanel({
  title,
  body,
  badgeNumber,
  icon,
  className = "",
}: TealFeaturePanelProps) {
  return (
    <div className={`${styles.panel} ${className}`}>
      {badgeNumber && <div className={styles.badgeNumber}>{badgeNumber}</div>}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.body}>{body}</p>
      {icon && <div className={styles.bottomIconTag}>{icon}</div>}
    </div>
  );
}
