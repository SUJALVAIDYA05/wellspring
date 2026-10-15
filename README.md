# Wellspring — Modern Hospital Website

A modern, accessible, and high-performance hospital web application built with **Next.js (App Router)** and **TypeScript**. 

The design faithfully implements the visual hierarchy, editorial layout, and color identity established in `Teal White and Black Modern Hospital Promotion Medical Presentation.pdf`.

---

## 1. Specifications & Source of Truth

The project strictly adheres to five core specification documents committed in the repository root:

- [`frontend.md`](./frontend.md): Visual fidelity rules, layout compositions, accessibility standards, responsive breakpoints, and route architecture.
- [`backend.md`](./backend.md): API contract, data models (Prisma/PostgreSQL), concurrency safety (no overlapping doctor appointments), role-based staff authentication, and testing requirements.
- [`features.md`](./features.md): Public user journeys for appointment booking, doctor selection, department/service directory, emergency information, and staff portal.
- [`annimations.md`](./annimations.md): Restrained motion tokens, micro-interactions, and mandatory `prefers-reduced-motion` compliance.
- [`content.md`](./content.md): The single source of truth for public text, form labels, and disclaimers. Fictional facts/testimonials are strictly avoided; unverified details are maintained as clearly marked editable placeholders.

---

## 2. Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type checking)
- **Styling**: Vanilla CSS Design System with CSS Tokens (Teal, White, and Black palette; motion tokens; responsive utilities)
- **Database (Planned)**: PostgreSQL managed via [Prisma ORM](https://www.prisma.io/)
- **API Validation**: Route Handlers with [Zod](https://zod.dev/) schema enforcement
- **Linting & Code Quality**: ESLint with `eslint-config-next`

---

## 3. Project Directory Structure

```text
wellspring/
├── .env.example                                                      # Environment variable template (safe defaults)
├── annimations.md                                                    # Animation & motion specifications
├── backend.md                                                        # Backend data model & API contracts
├── content.md                                                        # Content source of truth & placeholders
├── features.md                                                       # Feature workflows & acceptance criteria
├── frontend.md                                                       # Frontend design rules & route roadmap
├── Teal White and Black Modern Hospital Promotion Medical Presentation.pdf # Visual reference design
├── next.config.ts                                                    # Next.js configuration
├── package.json                                                      # Dependencies & scripts
├── tsconfig.json                                                     # TypeScript compiler options
├── src/
│   ├── app/
│   │   ├── globals.css                                               # CSS variables (colors, typography, motion tokens)
│   │   ├── layout.tsx                                                # Root HTML layout & global metadata
│   │   └── page.tsx                                                  # Foundational home page
│   ├── content/
│   │   └── hospital-content.ts                                       # Typed content module sourced from content.md
│   ├── lib/
│   │   └── constants.ts                                              # App configuration, timezones, and enum constants
│   └── types/
│       └── index.ts                                                  # Domain TypeScript models & API DTOs
```

---

## 4. Environment Variables Setup

Copy the environment template file to create your local environment file:

```bash
cp .env.example .env.local
```

### Environment Variables Template

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/wellspring?schema=public` |
| `AUTH_SECRET` | Secret key for session encryption | `min-32-chars-development-secret` |
| `NEXTAUTH_URL` | Base application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Client-accessible base URL | `http://localhost:3000` |
| `HOSPITAL_TIMEZONE` | IANA timezone for clinic schedules | `America/New_York` |
| `PENDING_SLOT_HOLD_MINUTES` | Hold duration for pending bookings | `15` |

> **Security Note**: Never commit `.env.local` or any production secrets to source control.

---

## 5. Getting Started & Development

### Prerequisites

- Node.js `v20.x` or later (tested on Node v25.8.2)
- npm `v10.x` or later

### Installation

```bash
npm install
```

### Running Locally

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Building for Production

Compile and validate TypeScript types, route generation, and static pages:

```bash
npm run build
```

Run code quality linting:

```bash
npm run lint
```

---

## 6. Implementation Status & Next Steps

### Completed in Phase 1
- [x] Inspected all 5 specification files and the 10-page design reference PDF.
- [x] Initialized Next.js App Router project with TypeScript and ESLint.
- [x] Preserved all existing specification documents and assets intact.
- [x] Added core TypeScript domain models (`src/types/index.ts`) matching `backend.md`.
- [x] Extracted structured content and disclaimers (`src/content/hospital-content.ts`) from `content.md`.
- [x] Documented repository setup, directory architecture, and safe `.env.example`.

### Completed in Phase 2 (Frontend Foundation & Public-Facing Routes)
- [x] **Visual Design System & Tokens**: Integrated exact PDF colors (Teal `#67c0b3`, Slate `#2d3f4e`, White `#ffffff`, Black `#000000`), Poppins display typography, and Bricolage Grotesque brand fonts in [`globals.css`](./src/app/globals.css).
- [x] **Vector Logo & Assets**: Extracted and rendered the exact hospital vector cross logo mark ([`HospitalLogo.tsx`](./src/components/common/HospitalLogo.tsx)) and authentic high-resolution clinical photography from the reference PDF.
- [x] **Shared Layout & Navigation**: Responsive [`SiteHeader`](./src/components/layout/SiteHeader.tsx) with mobile drawer, accessible focus outlines, [`SiteFooter`](./src/components/layout/SiteFooter.tsx) with contact directory and dynamic copyright year, and [`PageContainer`](./src/components/layout/PageContainer.tsx).
- [x] **Homepage (`/`)**:
  - Page 1 Hero with two-tone display headline, doctor cutout over teal circular backdrop, and bottom contact strip.
  - High-priority [`EmergencyBanner`](./src/components/home/EmergencyBanner.tsx).
  - Asymmetric Care Section ([`AsymmetricCareSection`](./src/components/home/AsymmetricCareSection.tsx)) reproducing PDF Page 2 & 3 composition.
  - Departments Preview ([`FeaturedDepartmentsSection`](./src/components/home/FeaturedDepartmentsSection.tsx)) with wide clinical banner and three aligned teal feature panels.
  - Featured Doctors Preview ([`FeaturedDoctorsSection`](./src/components/home/FeaturedDoctorsSection.tsx)) with [`DoctorCard`](./src/components/doctors/DoctorCard.tsx).
  - Closing Appointment CTA ([`AppointmentCtaSection`](./src/components/home/AppointmentCtaSection.tsx)).
- [x] **About Page (`/about`)**: Editorial layout with healthcare team imagery and numbered guiding principle panels (PDF Page 5).
- [x] **Contact Page (`/contact`)**: Hospital directory and accessible [`ContactForm`](./src/components/contact/ContactForm.tsx) with validation states.
- [x] **Departments Directory & Detail (`/departments`, `/departments/[slug]`)**: Department cards, service lists, affiliated physicians, and 404 not-found fallbacks.
- [x] **Doctor Directory & Profiles (`/doctors`, `/doctors/[slug]`)**: Search and filter controls, credential details, and backend schedule state compliance.
- [x] **Appointment Booking Page (`/appointments`)**: Complete initial booking form layout with department/doctor selection, date picker, slot selector, and API status notice.
- [x] **Emergency Page (`/emergency`)**: Clear separation from routine booking, high-visibility emergency phone, arrival instructions, and triage warnings.
- [x] **Build & Quality Assurance**: Zero TypeScript errors, zero ESLint warnings, all 17 static/SSG routes prerendering cleanly.

### Next Steps (Subsequent Phases)
1. **Database & Migrations**: Initialize Prisma schema for PostgreSQL with models (`Doctor`, `Department`, `Service`, `DoctorSchedule`, `DoctorScheduleException`, `Appointment`, `StaffUser`, `AuditLog`) and concurrency constraints.
2. **API Routes**: Implement Route Handlers under `src/app/api/` with Zod schema validation.
3. **Staff Authentication & Portal**: Implement secure session management and role-based access for `ADMIN` and `EMPLOYEE` roles.