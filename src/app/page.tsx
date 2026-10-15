import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { EmergencyBanner } from "@/components/home/EmergencyBanner";
import { AsymmetricCareSection } from "@/components/home/AsymmetricCareSection";
import { FeaturedDepartmentsSection } from "@/components/home/FeaturedDepartmentsSection";
import { FeaturedDoctorsSection } from "@/components/home/FeaturedDoctorsSection";
import { AppointmentCtaSection } from "@/components/home/AppointmentCtaSection";

export default function HomePage() {
  return (
    <main id="main-content">
      {/* 1. Page 1 Composition: Hero with Two-Tone Headline, Teal Oval & Doctor Photo */}
      <HeroSection />

      {/* 2. Prominent Emergency Notice Banner */}
      <EmergencyBanner />

      {/* 3. Page 2 & 3 Composition: Asymmetric Image/Text Layout with Teal Geometric Backing */}
      <AsymmetricCareSection />

      {/* 4. Page 4 Composition: Wide Clinical Image & Three Aligned Teal Feature Panels */}
      <FeaturedDepartmentsSection />

      {/* 5. Page 5 & 6 Composition: Featured Clinical Doctors Preview */}
      <FeaturedDoctorsSection />

      {/* 6. Page 10 Composition: Closing Appointment Callout Card */}
      <AppointmentCtaSection />
    </main>
  );
}
