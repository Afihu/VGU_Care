<!-- API Documentation -->

## Appointment Management API (Student)

**Base Path:** `/api/appointments`
(Authentication: JWT Bearer Token, Role: `student` required for all)

### 1. Get Student Appointments
*   **Endpoint:** `GET /`
*   **Description:** Retrieves appointments for the authenticated student.
*   **Success (200 OK):** Array of appointment objects under `"appointments"` key.
    *   Key fields per appointment: `id`, `userId`, `status`, `dateRequested`, `dateScheduled`, `priorityLevel`, `symptoms`, `hasAdvice`.

### 2. Create New Appointment
*   **Endpoint:** `POST /`
*   **Request Body:** `{ "symptoms": "String", "priorityLevel": "low|medium|high" }`
*   **Success (201 Created):** Created appointment object under `"appointment"` key.
*   **Error (400 Bad Request):** Missing/invalid fields.

### 3. Update Existing Appointment
*   **Endpoint:** `PATCH /:id` (`:id` = `appointment_id`)
*   **Request Body (only fields to update):**
    ```json
    {
      "symptoms": "String",
      "status": "scheduled|cancelled",
      "priorityLevel": "low|medium|high",
      "dateScheduled": "TimestampString" 
    }
    ```
*   **Success (200 OK):** Updated appointment object under `"appointment"` key.
*   **Errors:** `400 Bad Request` (invalid fields), `403 Forbidden` (not owner), `404 Not Found`.

---

