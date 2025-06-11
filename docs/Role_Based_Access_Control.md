# Role-Based Access Control (RBAC) in VGU Care

This document outlines the role-based access control mechanisms implemented within the VGU Care application, ensuring users can only access features and data appropriate for their roles.

## Appointment Management - Student Role

Students have specific rights and limitations when managing their medical appointments. The system ensures they can only manage their *own* appointments.

**Key Principles:**
*   **Authentication:** All appointment-related actions require a student to be logged in.
*   **Authorization (Role Check):** Most creation and modification actions are explicitly restricted to users with the 'student' role.
*   **Ownership:** Logic within controllers and services ensures students can only view or modify appointments linked to their user ID.

### Rights:
*   **View their own appointments:** `GET /api/appointments`
*   **Create appointments for themselves:** `POST /api/appointments`
    *   Requires `symptoms` and `priorityLevel`.
*   **Update their own appointments:** `PATCH /api/appointments/:id`
    *   Updatable fields: `symptoms`, `status` (to 'scheduled' or 'cancelled'), `priorityLevel`, `dateScheduled`.
*   **View advice for their own appointments:** `GET /api/appointments/:id/advice`

### Notes:
*   Cannot view, create, or update appointments for other users.
*   Cannot modify appointment fields not explicitly permitted (e.g., cannot change status to 'completed').
*   Cannot bypass authentication or role checks.

