import React from "react";
import Link from "next/link";
import styles from "./Button.module.css";

export interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "emergency" | "emergency-outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  ariaLabel,
}: ButtonProps) {
  const combinedClassName = [
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href && !disabled) {
    return (
      <Link href={href} className={combinedClassName} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
