import React from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { ContactForm } from "@/components/contact/ContactForm";
import { HOSPITAL_CONTENT } from "@/content/hospital-content";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact our team for general enquiries, directions, or information about arranging an appointment.",
};

export default function ContactPage() {
  const { contact } = HOSPITAL_CONTENT;

  return (
    <PageContainer size="default">
      <div className={styles.wrapper}>
        <SectionHeading
          eyebrow="GET IN TOUCH"
          tealPart="How Can"
          darkPart="We Help?"
          order="teal-first"
          subtitle="Contact our team for general enquiries, directions, or information about arranging an appointment."
        />

        <div className={styles.grid}>
          {/* Left Column: Official Contact Details & Reference Teal Strip */}
          <div className={styles.infoCol}>
            <div className={styles.contactPanel}>
              <h3 className={styles.panelHeading}>Hospital Directory</h3>
              <p className={styles.panelSubtext}>
                For non-emergency enquiries, reach out through the verified contact points below:
              </p>

              <div className={styles.itemRow}>
                <span className={styles.iconCircle} aria-hidden="true">📞</span>
                <div>
                  <strong>Telephone</strong>
                  <p>{contact.phone}</p>
                </div>
              </div>

              <div className={styles.itemRow}>
                <span className={styles.iconCircle} aria-hidden="true">✉️</span>
                <div>
                  <strong>Email Address</strong>
                  <p>{contact.email}</p>
                </div>
              </div>

              <div className={styles.itemRow}>
                <span className={styles.iconCircle} aria-hidden="true">📍</span>
                <div>
                  <strong>Physical Address</strong>
                  <p>{contact.address}</p>
                </div>
              </div>

              <div className={styles.itemRow}>
                <span className={styles.iconCircle} aria-hidden="true">🕒</span>
                <div>
                  <strong>Operating Hours</strong>
                  <p>{contact.hours}</p>
                </div>
              </div>
            </div>

            {/* Emergency Prompt */}
            <div className={styles.emergencyBox}>
              <h4>Facing an Immediate Emergency?</h4>
              <p>
                Do not submit an online form for emergency symptoms. Visit emergency care or call emergency services immediately.
              </p>
              <Button href="/emergency" variant="emergency" size="sm">
                Emergency Information →
              </Button>
            </div>
          </div>

          {/* Right Column: Contact Message Form (Client Component) */}
          <div className={styles.formCol}>
            <ContactForm />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
