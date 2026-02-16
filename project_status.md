# Unified Campus Events Fabric (UCEF) - Project Planix

## Comprehensive System Documentation

### 1. Executive Summary

**Project Name:** Planix (Unified Campus Events Fabric)
**Objective:** To build a web-based participation intelligence system that manages events as evolving processes, ensuring no contribution disappears using longitudinal participation profiles.

This document serves as a complete reference for the current state of the project, detailing the architecture, implemented features, and how it addresses the core challenges of Problem Statement 4 (PS 4).

---

### 2. System Architecture

The system is built using a robust **MERN Stack** (MongoDB, Express.js, React, Node.js) designed for scalability and real-time interaction.

- **Frontend:** React.js with Vite, TailwindCSS for styling.
  - Modern, responsive UI with distinct layouts for detailed Role-Based Access Control (RBAC).
  - Integrated QR Scanner for attendance.
  - PDF generation and visualization for certificates.
- **Backend:** Node.js with Express.js.
  - RESTful API architecture.
  - Secure authentication and authorization middleware.
  - Email service integration for notifications and certificate delivery.
- **Database:** MongoDB.
  - Relational-style data modeling with Mongoose (Events linked to Participants, Teams, and Certificates).
  - Atomic transactions for critical operations (registration, attendance marking).

---

### 3. Core Modules & Implemented Features

#### A. Role-Based Access Control (RBAC)

The system strictly separates concerns across three primary roles:

1.  **Admin:**
    - **System Oversight:** Full view of all events, users, and logs.
    - **User Management:** Manage organizers (Team Leads/Members) and permissions.
    - **Analytics:** Global reports and system health monitoring.
2.  **Organizer (Team Lead/Member):**
    - **Event Management:** Create, edit, and manage event lifecycles.
    - **Attendance:** Generate dynamic QR codes and scan participant tickets.
    - **Certification:** Bulk generate and email certificates.
3.  **Participant (Student):**
    - **Discovery:** Browse upcoming, ongoing, and past events.
    - **Digital Wallet:** Access registration tickets (QR) and earned certificates.
    - **Profile:** View longitudinal participation history.

#### B. Event Lifecycle Management

The system treats events as dynamic processes, not static pages:

- **Creation & Drafts:** Organizers can draft events with detailed metadata (location, fees, team).
- **Registration Window:** Automated controls for registration deadlines and capacity limits.
- **Live Mode:** Real-time stats during the event (Live Attendance queries).
- **Completion:** Post-event workflows for certification and feedback.
- **Archival:** Permanent read-only records for history.

#### C. Participation Intelligence & Attendance

Solving the "Attendance vs. Participation" problem:

- **Smart Registration:** Checks for duplicate entries, valid student data, and payment status (if applicable).
- **Secure Attendance:**
  - **Dynamic QR Codes:** Organizers generate time-limited, rotating QR codes to prevent proxy attendance (screensharing).
  - **QR Scanning:** Built-in scanner for organizers to validate participants instantly.
  - **Manual Override:** Fallback for manual attendance marking by authorized staff.
- **Live Dashboard:** Real-time counters for Registered vs. Attended.

#### D. Certificate Authority System

A complete workflow for verifiable credentials:

- **Template Engine:** Supports multiple certificate templates (Participation, Merit, etc.).
- **Automated Generation:** One-click generation for all _eligible_ (attended) participants.
- **Distribution:** Integrated email service sends certificates directly to students.
- **Verification:** Each certificate has a unique ID and QR code for authenticity verification.
- **Cloud Storage:** Integration with Cloudinary for persistent certificate hosting.

#### E. Student Profiles (Longitudinal Data)

Preserving history across time:

- **Unified History:** A single view of every event a student has interacted with (Registered, Attended, Certified).
- **Stats:** Personal dashboard showing total participations and achievements.

---

### 4. Alignment with Problem Statement (PS 4)

| Requirement                         | Implemented Solution                                                | Status      |
| :---------------------------------- | :------------------------------------------------------------------ | :---------- |
| **Manage full event lifecycle**     | Complete state machine (Draft -> Published -> Ongoing -> Completed) | ✅ **Done** |
| **Track participation reliability** | Dual-Verification (Registration + Physical QR Scan)                 | ✅ **Done** |
| **Generate verifiable records**     | Unique Certificate IDs + Cloud Storage + Email Delivery             | ✅ **Done** |
| **Longitudinal profiles**           | Persistent Student History & Profile Page                           | ✅ **Done** |
| **Role-based workflows**            | Distinct Admin, Organizer, and Participant portals/layouts          | ✅ **Done** |
| **Attendance Logic**                | Dynamic QR Codes (prevents proxy) & Session management              | ✅ **Done** |

---

### 5. Technical Highlights

- **Security:**
  - JWT-based authentication.
  - Password hashing (Bcrypt).
  - Protected API routes.
- **Performance:**
  - Optimized database queries (indexing on email/event IDs).
  - CDN usage for static assets (Cloudinary).
- **UX/UI:**
  - **modern design system** (Space Grotesk typography, Lime/Dark theme).
  - **Responsive:** optimized for mobile (students) and desktop (organizers).

### 6. Conclusion

The system effectively bridges the gap between simple event listing and complex participation intelligence. It is not just logging who signed up, but verifying who showed up and rewarding them with permanent credentials, creating a "contribution history" as requested.
