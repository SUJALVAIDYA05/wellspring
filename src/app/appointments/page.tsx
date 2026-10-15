import React, { Suspense } from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/common/SectionHeading";
import { AppointmentBookingForm } from "./AppointmentBookingForm";
import styles from "./appointments.module.css";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description:
    "Choose a department or doctor, then select from available appointment times. Processed according to hospital booking policy.",
};

export default function AppointmentsPage() {
  return (
    <PageContainer size="narrow">
      <div className={styles.wrapper}>
        <SectionHeading
          eyebrow="PATIENT SCHEDULING"
          tealPart="Request an"
          darkPart="Appointment"
          order="teal-first"
          subtitle="Choose a department or doctor, then select from the available appointment times. Your request will be processed according to the hospital's booking policy."
        />

        <Suspense
          fallback={
            <div className={styles.loadingBox}>
              <p>Loading booking schedule…</p>
            </div>
          }
        >
          <AppointmentBookingForm />
        </Suspense>
      </div>
    </PageContainer>
  );
}
