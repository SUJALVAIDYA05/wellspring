import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, StaffRole, AppointmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/wellspring?schema=public",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(pw: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

async function main() {
  console.log("🌱 Starting development database seed (FICTIONAL DATA ONLY)...");

  // Clear existing seed data in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctorScheduleException.deleteMany({});
  await prisma.doctorSchedule.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.staffUser.deleteMany({});

  // 1. Staff Users
  const adminPasswordHash = await hashPassword("Admin1234!");
  const employeePasswordHash = await hashPassword("Staff1234!");

  const adminUser = await prisma.staffUser.create({
    data: {
      name: "Dev Admin [FICTIONAL]",
      email: "admin@fictional-wellspring.local",
      passwordHash: adminPasswordHash,
      role: StaffRole.ADMIN,
      isActive: true,
    },
  });

  const employeeUser = await prisma.staffUser.create({
    data: {
      name: "Dev Staff Employee [FICTIONAL]",
      email: "staff@fictional-wellspring.local",
      passwordHash: employeePasswordHash,
      role: StaffRole.EMPLOYEE,
      isActive: true,
    },
  });

  console.log(`✓ Created 2 fictional staff users: ${adminUser.email}, ${employeeUser.email}`);

  // 2. Departments
  const deptGeneral = await prisma.department.create({
    data: {
      slug: "general-medicine",
      name: "General Medicine [FICTIONAL DEV DATA]",
      summary: "Comprehensive outpatient and preventative medical consultations.",
      description:
        "Fictional department test record. Provides standard internal medicine and diagnostic workups.",
      isActive: true,
    },
  });

  const deptCardio = await prisma.department.create({
    data: {
      slug: "cardiology",
      name: "Cardiology & Heart Center [FICTIONAL DEV DATA]",
      summary: "Cardiovascular assessments, ECG evaluation, and chronic management.",
      description:
        "Fictional department test record for clinical and consultative cardiology.",
      isActive: true,
    },
  });

  const deptPediatrics = await prisma.department.create({
    data: {
      slug: "pediatrics",
      name: "Pediatrics & Child Wellness [FICTIONAL DEV DATA]",
      summary: "Primary and specialized clinical care for infants and children.",
      description:
        "Fictional department test record for developmental and routine child healthcare.",
      isActive: true,
    },
  });

  const deptSpecialist = await prisma.department.create({
    data: {
      slug: "specialist-care",
      name: "Specialist Care & Diagnostics",
      summary: "Advanced outpatient consultations, diagnostic assessments, and specialist clinics.",
      description:
        "Providing cardiology, endocrinology, and targeted subspecialty diagnostics with integrated treatment planning.",
      isActive: true,
    },
  });

  const deptWellness = await prisma.department.create({
    data: {
      slug: "community-wellness",
      name: "Community & Preventative Wellness",
      summary: "Health screenings, lifestyle guidance, and preventative primary care.",
      description:
        "Dedicated to holistic outpatient wellness, annual executive physicals, routine immunizations, and community health.",
      isActive: true,
    },
  });

  console.log("✓ Created 5 fictional departments");

  // 3. Services
  await prisma.service.createMany({
    data: [
      {
        slug: "routine-checkup",
        name: "Routine Health Checkup [FICTIONAL]",
        summary: "Annual clinical examination and vital signs assessment.",
        description: "Fictional service definition for development testing.",
        departmentId: deptGeneral.id,
        isActive: true,
      },
      {
        slug: "chronic-disease-management",
        name: "Chronic Condition Care [FICTIONAL]",
        summary: "Hypertension, diabetes, and long-term wellness monitoring.",
        description: "Fictional service definition for development testing.",
        departmentId: deptGeneral.id,
        isActive: true,
      },
      {
        slug: "ecg-cardiac-consult",
        name: "Cardiac Consultation & ECG [FICTIONAL]",
        summary: "Specialist consultation with resting ECG tracing.",
        description: "Fictional service definition for development testing.",
        departmentId: deptCardio.id,
        isActive: true,
      },
      {
        slug: "pediatric-immunization",
        name: "Child Immunization Clinic [FICTIONAL]",
        summary: "Routine pediatric immunization and growth milestone review.",
        description: "Fictional service definition for development testing.",
        departmentId: deptPediatrics.id,
        isActive: true,
      },
    ],
  });

  console.log("✓ Created 4 fictional services");

  // 4. Doctors
  const docCarter = await prisma.doctor.create({
    data: {
      slug: "dr-alex-carter",
      fullName: "Dr. Alex Carter [FICTIONAL]",
      specialty: "Internal Medicine & General Practice",
      departmentId: deptGeneral.id,
      qualifications: ["MD (Fictional Univ)", "Board Certified Internal Medicine"],
      biography:
        "FICTIONAL PROFILE: Dr. Alex Carter has 12 years of fictional clinical experience in primary care.",
      photoUrl: "/images/hero-doctor-cutout.png",
      isActive: true,
    },
  });

  const docVance = await prisma.doctor.create({
    data: {
      slug: "dr-beatrice-vance",
      fullName: "Dr. Beatrice Vance [FICTIONAL]",
      specialty: "Consultant Cardiologist",
      departmentId: deptCardio.id,
      qualifications: ["MBBS (Fictional)", "FRCP (Fictional)", "FACC"],
      biography:
        "FICTIONAL PROFILE: Dr. Beatrice Vance specializes in preventative cardiology and heart health.",
      photoUrl: "/images/doctor-male-portrait.jpg",
      isActive: true,
    },
  });

  const docChen = await prisma.doctor.create({
    data: {
      slug: "dr-clara-chen",
      fullName: "Dr. Clara Chen [FICTIONAL]",
      specialty: "Pediatric Medicine",
      departmentId: deptPediatrics.id,
      qualifications: ["MD (Fictional Medical School)", "FAAP"],
      biography:
        "FICTIONAL PROFILE: Dr. Clara Chen provides pediatric and adolescent developmental care.",
      photoUrl: "/images/doctor-consultation.jpg",
      isActive: true,
    },
  });

  const docJenkins = await prisma.doctor.create({
    data: {
      slug: "lead-physician-general-medicine",
      fullName: "Dr. Sarah Jenkins, MD",
      specialty: "Lead Physician — General Medicine",
      departmentId: deptGeneral.id,
      qualifications: ["MD, FACP", "Board Certified Internal Medicine"],
      biography:
        "Dr. Sarah Jenkins brings over fifteen years of comprehensive primary care experience, specializing in preventative medicine, complex chronic illness management, and patient-centered diagnostic evaluations.",
      photoUrl: "/images/hero-doctor-cutout.png",
      isActive: true,
    },
  });

  const docMarcus = await prisma.doctor.create({
    data: {
      slug: "lead-cardiologist-specialist",
      fullName: "Dr. Marcus Vance, MD",
      specialty: "Cardiologist & Clinical Specialist",
      departmentId: deptCardio.id,
      qualifications: ["MD, FACC", "Fellow of the American College of Cardiology"],
      biography:
        "Dr. Marcus Vance leads cardiovascular diagnostic testing, arrhythmia management, and non-invasive cardiac interventions with clinical precision.",
      photoUrl: "/images/doctor-male-portrait.jpg",
      isActive: true,
    },
  });

  const docElena = await prisma.doctor.create({
    data: {
      slug: "lead-family-practitioner",
      fullName: "Dr. Elena Rostova, MD",
      specialty: "Family Medicine & Preventative Care",
      departmentId: deptWellness.id,
      qualifications: ["MD, FAAFP", "Board Certified Family Medicine"],
      biography:
        "Dr. Elena Rostova partners with patients across all stages of life, focusing on lifestyle wellness, proactive early disease detection, and whole-family outpatient care.",
      photoUrl: "/images/doctor-consultation.jpg",
      isActive: true,
    },
  });

  const docInactive = await prisma.doctor.create({
    data: {
      slug: "dr-inactive-physician",
      fullName: "Dr. Retired Physician [INACTIVE]",
      specialty: "Emeritus Consultation",
      departmentId: deptGeneral.id,
      qualifications: ["MD (Retired)"],
      biography: "This profile is inactive for booking tests.",
      photoUrl: "/images/hero-doctor.jpg",
      isActive: false,
    },
  });

  console.log("✓ Created 6 fictional doctors (including 1 inactive)");

  // 5. Schedules (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  // Dr. Carter: Mon-Fri 09:00 - 17:00, 30 min slots
  const carterSchedules = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    doctorId: docCarter.id,
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
    slotDurationMinutes: 30,
    isActive: true,
  }));

  // Dr. Vance: Mon, Wed, Fri 10:00 - 16:00, 30 min slots
  const vanceSchedules = [1, 3, 5].map((dayOfWeek) => ({
    doctorId: docVance.id,
    dayOfWeek,
    startTime: "10:00",
    endTime: "16:00",
    slotDurationMinutes: 30,
    isActive: true,
  }));

  // Dr. Chen: Tue, Thu 09:00 - 15:00, 30 min slots
  const chenSchedules = [2, 4].map((dayOfWeek) => ({
    doctorId: docChen.id,
    dayOfWeek,
    startTime: "09:00",
    endTime: "15:00",
    slotDurationMinutes: 30,
    isActive: true,
  }));

  // Dr. Jenkins: Mon-Fri 09:00 - 17:00, 30 min slots
  const jenkinsSchedules = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    doctorId: docJenkins.id,
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
    slotDurationMinutes: 30,
    isActive: true,
  }));

  // Dr. Marcus: Mon, Wed, Fri 10:00 - 16:00, 30 min slots
  const marcusSchedules = [1, 3, 5].map((dayOfWeek) => ({
    doctorId: docMarcus.id,
    dayOfWeek,
    startTime: "10:00",
    endTime: "16:00",
    slotDurationMinutes: 30,
    isActive: true,
  }));

  // Dr. Elena: Tue, Thu, Fri 09:00 - 15:00, 30 min slots
  const elenaSchedules = [2, 4, 5].map((dayOfWeek) => ({
    doctorId: docElena.id,
    dayOfWeek,
    startTime: "09:00",
    endTime: "15:00",
    slotDurationMinutes: 30,
    isActive: true,
  }));

  await prisma.doctorSchedule.createMany({
    data: [
      ...carterSchedules,
      ...vanceSchedules,
      ...chenSchedules,
      ...jenkinsSchedules,
      ...marcusSchedules,
      ...elenaSchedules,
    ],
  });

  console.log("✓ Created doctor recurring schedules");

  // 6. Schedule Exception (Dr. Carter on leave for 1 afternoon)
  const exceptionStart = new Date("2026-11-20T13:00:00Z");
  const exceptionEnd = new Date("2026-11-20T17:00:00Z");
  await prisma.doctorScheduleException.create({
    data: {
      doctorId: docCarter.id,
      startsAt: exceptionStart,
      endsAt: exceptionEnd,
      reason: "Attending annual medical conference [FICTIONAL]",
    },
  });

  console.log("✓ Created doctor schedule exception");

  // 7. Seed Appointment (Confirmed slot)
  await prisma.appointment.create({
    data: {
      referenceCode: "APT-TEST-0001",
      patientName: "Sample Patient [FICTIONAL]",
      patientPhone: "+1-555-0199",
      patientEmail: "patient@fictional-example.com",
      doctorId: docCarter.id,
      startsAt: new Date("2026-11-16T14:00:00Z"),
      endsAt: new Date("2026-11-16T14:30:00Z"),
      status: AppointmentStatus.CONFIRMED,
      reasonForVisit: "Routine annual checkup consultation [FICTIONAL]",
      createdByUserId: employeeUser.id,
    },
  });

  console.log("✓ Created 1 sample appointment");
  console.log("✅ Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
