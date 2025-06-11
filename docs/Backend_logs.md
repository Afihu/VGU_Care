<!-- This file is for logging backend development -->

## Feature Update: Student Appointment Management (June 11, 2025)

Students can now view, create, and update their own medical appointments.

**Key functionalities & Endpoints:**
1.  **View:** `GET /api/appointments`
2.  **Create:** `POST /api/appointments` (Requires: `symptoms`, `priorityLevel`)
3.  **Update:** `PATCH /api/appointments/:id` (Updatable: `symptoms`, `status` ['scheduled', 'cancelled'], `priorityLevel`, `dateScheduled`)

Detailed docs: `docs/StudentAppointmentManagement.md`.
