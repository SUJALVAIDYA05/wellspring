"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import { HospitalLogo } from "@/components/common/HospitalLogo";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { meta, navigation } = HOSPITAL_CONTENT;

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        {/* Hospital Brand & Wordmark */}
        <Link href="/" className={styles.brandLink} aria-label={`${meta.hospitalName} Home`}>
          <HospitalLogo className={styles.logoIcon} size={44} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>{meta.hospitalName}</span>
            <span className={styles.brandTagline}>{meta.tagline}</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          {navigation.main.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
          <Link
            href={navigation.emergency.href}
            className={styles.emergencyButton}
            aria-label="Emergency Care Instructions"
          >
            <span aria-hidden="true">🚨</span>
            {navigation.emergency.label}
          </Link>
        </nav>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <nav id="mobile-navigation" className={styles.mobileDrawer} aria-label="Mobile Navigation">
          {navigation.main.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={navigation.emergency.href}
            className={styles.mobileEmergency}
            onClick={() => setMobileMenuOpen(false)}
          >
            🚨 {navigation.emergency.label}
          </Link>
        </nav>
      )}
    </header>
  );
}
