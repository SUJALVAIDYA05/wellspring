"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/Button";
import styles from "./ContactForm.module.css";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className={styles.formCard}>
      <h3 className={styles.formHeading}>Send Us a Message</h3>
      <p className={styles.privacyNote}>
        Please do not include sensitive medical information in this form.
      </p>

      {submitted ? (
        <div className={styles.successBox} role="alert">
          <strong>Message Received (Development Notice)</strong>
          <p>
            Your message has been captured by the frontend form validator. Server-side contact
            routing and notification dispatch will be active when backend communication services are linked.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSubmitted(false)}
            className={styles.resetBtn}
          >
            Send Another Note
          </Button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="contact-name" className={styles.label}>
              Your name <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              id="contact-name"
              name="name"
              required
              placeholder="Enter your full name"
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="contact-phone" className={styles.label}>
              Phone number <span className={styles.req}>*</span>
            </label>
            <input
              type="tel"
              id="contact-phone"
              name="phone"
              required
              placeholder="e.g. +1 555-0199"
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="contact-email" className={styles.label}>
              Email address <span className={styles.req}>*</span>
            </label>
            <input
              type="email"
              id="contact-email"
              name="email"
              required
              placeholder="name@example.com"
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="contact-message" className={styles.label}>
              How can we help? <span className={styles.req}>*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={4}
              placeholder="Provide details of your general enquiry..."
              className={styles.textarea}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" className={styles.submitBtn}>
            Send Message
          </Button>
        </form>
      )}
    </div>
  );
}
