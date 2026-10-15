/**
 * Source of Truth for Website Content.
 * Sourced directly from content.md.
 * 
 * NOTE: As specified in content.md, placeholder fields marked with isConfirmed: false
 * must be confirmed by the hospital owner prior to production launch.
 */

export interface DepartmentItem {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  services: string[];
  isConfirmed: boolean;
}

export interface DoctorItem {
  id: string;
  slug: string;
  fullName: string;
  specialty: string;
  departmentSlug: string;
  departmentName: string;
  qualifications: string;
  biography: string;
  photoUrl: string;
  isConfirmed: boolean;
}

export const HOSPITAL_CONTENT = {
  meta: {
    hospitalName: "[HOSPITAL NAME — CONFIRM]",
    tagline: "[HOSPITAL TAGLINE — CONFIRM]",
    isConfirmed: false,
  },
  navigation: {
    main: [
      { label: "Home", href: "/" },
      { label: "About Us", href: "/about" },
      { label: "Departments & Services", href: "/departments" },
      { label: "Find a Doctor", href: "/doctors" },
      { label: "Book an Appointment", href: "/appointments" },
      { label: "Contact Us", href: "/contact" },
    ],
    emergency: {
      label: "Emergency Services",
      href: "/emergency",
    },
  },
  ctas: {
    primary: "Book an Appointment",
    secondary: "Find a Doctor",
    departments: "Explore Departments",
  },
  contact: {
    phone: "[HOSPITAL PHONE — CONFIRM]",
    email: "[HOSPITAL EMAIL — CONFIRM]",
    address: "[HOSPITAL ADDRESS — CONFIRM]",
    hours: "[VERIFIED HOURS — CONFIRM]",
    emergencyPhone: "[VERIFIED EMERGENCY NUMBER — REQUIRED BEFORE LAUNCH]",
    emergencyAddress: "[VERIFIED EMERGENCY DEPARTMENT ADDRESS — CONFIRM]",
    emergencyHours: "[VERIFIED EMERGENCY SERVICE HOURS — CONFIRM]",
    directions: "[VERIFIED DIRECTIONS — OPTIONAL]",
    isConfirmed: false,
  },
  hero: {
    eyebrow: "QUALITY HEALTHCARE",
    headlinePart1: "[HOSPITAL NAME — CONFIRM]",
    headlinePart2: "Care You Can Trust",
    supportingText:
      "Explore our departments, meet our doctors, and request an appointment with our team.",
  },
  about: {
    pageTitle: "About Our Hospital",
    introHeading: "Our Commitment to Care",
    introBody:
      "Learn about our hospital, our approach to care, and the services available to patients and families.",
    mission: "[HOSPITAL-APPROVED MISSION STATEMENT — PROVIDE]",
    vision: "[HOSPITAL-APPROVED VISION STATEMENT — PROVIDE]",
    history: "[VERIFIED HOSPITAL HISTORY — PROVIDE]",
    facilities: "[VERIFIED DETAILS ONLY — PROVIDE]",
    isConfirmed: false,
  },
  emergencySection: {
    heading: "Need Emergency Care?",
    body: "If you are facing a life-threatening emergency, contact local emergency services or go to the nearest emergency department. Do not wait for an online response.",
  },
  departments: [
    {
      id: "dept-1",
      slug: "general-medicine",
      name: "General Medicine & Outpatient",
      summary:
        "Comprehensive primary healthcare consultations, preventative health screenings, and coordinated care pathways for individuals and families.",
      description:
        "Our General Medicine Department delivers comprehensive, patient-centered care for adult and family health needs. Our physicians emphasize prevention, early diagnosis, and long-term wellness management.",
      services: [
        "Preventative health assessments & screenings",
        "Chronic condition management (hypertension, diabetes)",
        "Routine consultations & acute symptom evaluation",
        "Vaccination & immunisation reviews",
        "Specialist referral and diagnostic coordination",
      ],
      isConfirmed: false,
    },
    {
      id: "dept-2",
      slug: "specialist-care",
      name: "Specialist & Clinical Services",
      summary:
        "Specialized clinical consultations across cardiology, neurology, and orthopedics supported by certified medical practitioners and modern diagnostic tools.",
      description:
        "Our Specialist Clinical Services bring together experienced medical consultants in cardiology, neurology, and musculoskeletal care to evaluate complex symptoms and provide evidence-based treatment plans.",
      services: [
        "Clinical cardiology consultation & ECG review",
        "Neurological assessments & headache clinics",
        "Orthopedic joint & mobility consultations",
        "Post-operative recovery planning",
      ],
      isConfirmed: false,
    },
    {
      id: "dept-3",
      slug: "community-wellness",
      name: "Community Outreach & Wellness",
      summary:
        "Accessible health guidance, routine vaccination clinics, and preventative educational workshops fostering healthcare engagement across local communities.",
      description:
        "We work directly with individuals, schools, and local organizations to provide healthcare education, routine health checks, and accessible medical guidance.",
      services: [
        "Community health education talks",
        "Public health screenings & check-up clinics",
        "Family wellness & lifestyle counseling",
      ],
      isConfirmed: false,
    },
  ] as DepartmentItem[],
  doctors: [
    {
      id: "doc-1",
      slug: "lead-physician-general-medicine",
      fullName: "[VERIFIED DOCTOR NAME — CONFIRM]",
      specialty: "Internal Medicine & Primary Care",
      departmentSlug: "general-medicine",
      departmentName: "General Medicine & Outpatient",
      qualifications: "[VERIFIED QUALIFICATIONS — CONFIRM]",
      biography:
        "[APPROVED BIOGRAPHY — Doctor profile undergoing verification according to hospital credentialing policy.]",
      photoUrl: "/images/hero-doctor-cutout.png",
      isConfirmed: false,
    },
    {
      id: "doc-2",
      slug: "lead-cardiologist-specialist",
      fullName: "[VERIFIED DOCTOR NAME — CONFIRM]",
      specialty: "Consultant Cardiologist",
      departmentSlug: "specialist-care",
      departmentName: "Specialist & Clinical Services",
      qualifications: "[VERIFIED QUALIFICATIONS — CONFIRM]",
      biography:
        "[APPROVED BIOGRAPHY — Doctor profile undergoing verification according to hospital credentialing policy.]",
      photoUrl: "/images/doctor-male-portrait.jpg",
      isConfirmed: false,
    },
    {
      id: "doc-3",
      slug: "lead-family-practitioner",
      fullName: "[VERIFIED DOCTOR NAME — CONFIRM]",
      specialty: "Family & Community Health",
      departmentSlug: "community-wellness",
      departmentName: "Community Outreach & Wellness",
      qualifications: "[VERIFIED QUALIFICATIONS — CONFIRM]",
      biography:
        "[APPROVED BIOGRAPHY — Doctor profile undergoing verification according to hospital credentialing policy.]",
      photoUrl: "/images/doctor-consultation.jpg",
      isConfirmed: false,
    },
  ] as DoctorItem[],
  formMessages: {
    required: "This field is required.",
    invalidPhone: "Enter a valid phone number.",
    invalidEmail: "Enter a valid email address.",
    invalidDate: "Choose a valid future date.",
    loading: "Loading…",
    submitting: "Submitting your request…",
    slotConflict:
      "That time is no longer available. Please choose another available time.",
    validationError: "Please check the highlighted fields and try again.",
    generalError: "We couldn't submit your request. Please try again.",
    backToHome: "Back to Home",
  },
} as const;
