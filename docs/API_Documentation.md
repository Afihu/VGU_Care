# VGU Care - API Documentation

**Base URL**: `http://localhost:5001/api`  

## 📚 Quick Reference for Frontend Developers

---

## 🔐 Authentication APIs

### Login
- **POST** `/api/login`
- **Body**: 
  ```json
  {
    "email": "string (@vgu.edu.vn domain required)",
    "password": "string"
  }
  ```

- **Response**: 
  ```json
  {
    "message": "Login successful",
    "user": {
        "id": "user-uuid",
        "email": "<User Email>",
        "role": "<medical_staff|student|admin>",
        "status": "active|inactive|banned",
    },
    "token": "<JWT_TOKEN>",
  }
  ```

### Signup
- **POST** `/api/signup`
- **Body**: 
  ```json
  {
    "email": "string (@vgu.edu.vn domain required)",
    "password": "string",
    "name": "string", 
    "gender": "male", // Required: "male", "female", "other"
    "age": "number", // Required: positive integer
    "role": "student", // Required: "student", "medical_staff", "admin"
    "roleSpecificData": {
      // For Students:
      "intakeYear": "number (optional, defaults to current year)",
      "major": "string (optional, defaults to 'Undeclared')", 
      "housingLocation": "dorm_1", // Optional: "dorm_1", "dorm_2", "off_campus" (defaults to 'off_campus')
      
      // For Medical Staff:
      "specialty": "string (optional, defaults to 'General Medicine')",
      "specialtyGroup": "physical", // Optional: "physical", "mental" (defaults to 'physical')
      "shiftSchedule": {
        "monday": ["09:00-17:00"],
        "tuesday": ["09:00-17:00"],
        // ... other days (optional, defaults to Mon-Fri 9-5)
      }
      
      // For Admin: No additional fields required
    }
  }
  ```
- **Response**: `{ message: "User account created successfully", user: { id, email, role } }`

---

## 👤 User Profile APIs

### Get Current User Profile
- **GET** `/api/users/me`
- **Auth**: Bearer Token (All Roles)
- **Response**: 
```javascript
{
  "user": {
    "id": "uuid",
    "email": "student@vgu.edu.vn",
    "role": "student", // Possible values: "student", "medical_staff", "admin"
    "name": "John Doe",
    "gender": "male", // Possible values: "male", "female", "other"
    "age": 20,
    "status": "active", // Possible values: "active", "inactive", "banned"
    "points": 150,
    "createdAt": "2025-06-19T10:30:00Z",
    "updatedAt": "2025-06-19T10:30:00Z",
    
    // Role-specific fields for students:
    "intakeYear": 2023, // Only for students
    "major": "Computer Science", // Only for students
    "housingLocation": "dorm_1", // Only for students: "dorm_1", "dorm_2", "off_campus"
    
    // Role-specific fields for medical staff:
    "specialty": "General Medicine", // Only for medical staff
    "specialtyGroup": "physical", // Only for medical staff: "physical", "mental"
    "shiftSchedule": { // Only for medical staff
      "monday": ["09:00-17:00"],
      "tuesday": ["09:00-17:00"],
      "wednesday": ["09:00-17:00"],
      "thursday": ["09:00-17:00"],
      "friday": ["09:00-17:00"]
    }  }
}
```

### Update Profile
- **PATCH** `/api/users/profile`
- **Auth**: Bearer Token
- **Body**: 
  ```json
  {
    "name": "string (optional)",
    "gender": "male", // Optional: "male", "female", "other"
    "age": "number (optional)",
    "roleSpecificData": {
      // For Students:
      "intakeYear": "number (optional)",
      "major": "string (optional)",
      "housingLocation": "dorm_1", // Optional: "dorm_1", "dorm_2", "off_campus"
      
      // For Medical Staff:
      "specialty": "string (optional)",
      "specialtyGroup": "physical", // Optional: "physical", "mental"
      "shiftSchedule": {
        "monday": ["09:00-17:00"],
        "tuesday": ["09:00-17:00", "18:00-22:00"],
        // ... other days
      }
    }
  }
  ```
- **Response**: 
```javascript
{
  "message": "Profile updated successfully", 
  "user": {
    // Same structure as GET /users/me response
    "id": "uuid",
    "email": "student@vgu.edu.vn",
    "role": "student", // "student", "medical_staff", "admin"
    "name": "Updated Name",
    "gender": "male", // "male", "female", "other"
    "age": 21,
    "status": "active", // "active", "inactive", "banned"
    // ... role-specific fields  
    }
}
```

### Change Password
- **PATCH** `/api/users/change-password`
- **Auth**: Bearer Token
- **Body**: `{ currentPassword, newPassword }`

### Get User Profile by ID
- **GET** `/api/users/profile/:userId`
- **Auth**: Bearer Token (Role-based access)

### Get All Students
- **GET** `/api/users/students`
- **Auth**: Bearer Token (Medical Staff + Admin only)

---

## 📅 Appointment Management APIs

### Get Appointments (Role-Based)
**GET** `/api/appointments`
```javascript
// Example Response:
{
  "appointments": [
    {
      "id": "uuid",
      "userId": "uuid", 
      "medicalStaffId": "uuid", // null if not yet assigned
      "status": "pending", // Possible values: "pending", "approved", "rejected", "completed", "cancelled"
      "dateRequested": "2025-06-19T10:30:00Z",
      "dateScheduled": "2025-06-20T00:00:00Z",
      "timeScheduled": "09:00:00",
      "priorityLevel": "medium", // Possible values: "low", "medium", "high"
      "symptoms": "Headache and fever",
      "healthIssueType": "physical", // Possible values: "physical", "mental"
      "hasAdvice": false
    }
  ],
  "userRole": "student", // Possible values: "student", "medical_staff", "admin"
  "accessLevel": "filtered"
}
```
**Auth**: Bearer Token (All Roles)  
**Access**: 
- Students: Own appointments only
- Medical Staff: Assigned and pending appointments  
- Admin: All appointments  

### Get Pending Appointments
**GET** `/api/appointments/pending`
```javascript
// Example Response:
{
  "appointments": [
    {
      "id": "uuid",
      "userId": "uuid", 
      "status": "pending",
      "dateRequested": "2025-06-19T10:30:00Z",
      "dateScheduled": "2025-06-20T00:00:00Z",
      "timeScheduled": "09:00:00",
      "priorityLevel": "medium",
      "symptoms": "Headache and fever"
    }
  ]
}
```
**Auth**: Bearer Token (Medical Staff + Admin only)  
**Access**: Medical staff can see pending appointments assigned to them, admin can see all pending appointments  

### Get Available Time Slots
**GET** `/api/appointments/time-slots/:date`
```javascript
// Example Response:
{
  "date": "2025-06-20",
  "availableTimeSlots": [
    {
      "start_time": "09:00:00",
      "end_time": "09:20:00", 
      "startTimeFormatted": "09:00",
      "endTimeFormatted": "09:20"
    },
    {
      "start_time": "09:20:00",
      "end_time": "09:40:00",
      "startTimeFormatted": "09:20", 
      "endTimeFormatted": "09:40"
    },
    {
      "start_time": "10:00:00",
      "end_time": "10:20:00",
      "startTimeFormatted": "10:00",
      "endTimeFormatted": "10:20"
    }
  ],
  "message": "Found 15 available time slots for 2025-06-20"
}
```
**Auth**: Bearer Token (All Roles)  

### Create Appointment
**POST** `/api/appointments`
```javascript
// Request Body:
{
  "symptoms": "Headache and fever",
  "priorityLevel": "medium",           // Required: "low", "medium", "high"
  "healthIssueType": "physical",       // Required: "physical", "mental"
  "dateScheduled": "2025-06-20",       // Optional: specific date
  "timeScheduled": "09:00:00"          // Optional: specific time (requires dateScheduled)
}

// Example Response:
{
  "message": "Appointment created successfully",
  "appointment": {
    "id": "uuid",
    "userId": "uuid",
    "medicalStaffId": "uuid", // null if not yet assigned
    "status": "pending", // Default: "pending"
    "dateRequested": "2025-06-19T10:30:00Z",
    "dateScheduled": "2025-06-20T00:00:00Z",
    "timeScheduled": "09:00:00",
    "priorityLevel": "medium", // "low", "medium", "high"
    "symptoms": "Headache and fever",
    "healthIssueType": "physical" // "physical", "mental"
  }
}
```
**Auth**: Bearer Token  
**Access**:
- Students: Create for themselves (auto-assigned to least busy medical staff)
- Medical Staff: Create with self-assignment  
**Features**: 
- **Time Slot Validation** - Prevents double-booking of time slots
- **Auto-Assignment** - Appointments automatically assigned to medical staff with fewest appointments  

### Integration Flow
```javascript
// 1. User selects a date → Get available time slots
const getAvailableSlots = async (date) => {
  const response = await fetch(`/api/appointments/time-slots/${date}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// 2. Display available slots → User selects preferred time
// Frontend shows dropdown/buttons with available time slots

// 3. Create appointment with selected time slot
const createAppointment = async (appointmentData) => {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      symptoms: appointmentData.symptoms,
      priorityLevel: appointmentData.priorityLevel,
      dateScheduled: appointmentData.selectedDate,    // "2025-06-20"
      timeScheduled: appointmentData.selectedTime     // "09:00:00"
    })
  });
};

// 4. System validates availability and creates appointment
// If time slot is taken, returns error: "Selected time slot is not available"
```

### Get Specific Appointment
**GET** `/api/appointments/:appointmentId`
```javascript
// Example Response:
{
  "id": "uuid",
  "userId": "uuid",
  "medicalStaffId": "uuid", // null if not yet assigned
  "status": "pending", // Possible values: "pending", "approved", "rejected", "completed", "cancelled"
  "dateRequested": "2025-06-19T10:30:00Z", 
  "dateScheduled": "2025-06-20T00:00:00Z",
  "timeScheduled": "09:00:00",
  "priorityLevel": "medium", // Possible values: "low", "medium", "high"
  "symptoms": "Headache and fever",
  "healthIssueType": "physical" // Possible values: "physical", "mental"
}
```
**Auth**: Bearer Token (Ownership/Assignment required)  

### Update Appointment
**PATCH** `/api/appointments/:appointmentId`
```javascript
// Request Body:
{
  "symptoms": "Updated symptoms",      // Optional
  "status": "approved",               // Optional: "pending", "approved", "rejected", "completed", "cancelled"
  "priorityLevel": "high",            // Optional: "low", "medium", "high"
  "healthIssueType": "mental",        // Optional: "physical", "mental"
  "dateScheduled": "2025-06-21",      // Optional: new date (reschedule)
  "timeScheduled": "10:00:00"         // Optional: new time (reschedule - validates availability)
}

// Example Response:
{
  "id": "uuid",
  "userId": "uuid", 
  "medicalStaffId": "uuid",
  "status": "approved", // "pending", "approved", "rejected", "completed", "cancelled"
  "dateRequested": "2025-06-19T10:30:00Z",
  "dateScheduled": "2025-06-21T00:00:00Z",
  "timeScheduled": "10:00:00",
  "priorityLevel": "high", // "low", "medium", "high"
  "symptoms": "Updated symptoms",
  "healthIssueType": "mental" // "physical", "mental"
}
```
**Auth**: Bearer Token (Ownership/Assignment required)  
**Access Control**: 
- **Students**: Can update their own appointments (symptoms, priorityLevel, dateScheduled, timeScheduled) and cancel (status: "cancelled")
- **Medical Staff**: Can approve/reject/complete any assigned appointment (status: "approved", "rejected", "completed")
- **Admin**: Can update any field on any appointment
**Features**: 
- **Time Slot Validation** - Prevents rescheduling to unavailable time slots
- **Rescheduling** - Students can change date/time, system validates availability

### Delete Appointment
**DELETE** `/api/appointments/:appointmentId`
```javascript
// Example Response:
{
  "message": "Appointment deleted successfully"
}
```
**Auth**: Bearer Token (Ownership/Assignment required)  

### Get Appointments by User ID
**GET** `/api/appointments/user/:userId`
**Body**: None (no body required)
**Respond**:

```javascript
{
    "appointments": [
        {
            "id": "93c249bc-d80f-45ff-8b15-c16ba6ec456f",
            "userId": "41b1ce63-2e35-49db-86ba-085a60faca9c",
            "status": "pending",
            "dateRequested": "2025-06-25T08:57:09.367Z",
            "dateScheduled": "2025-06-26T00:00:00.000Z",
            "timeScheduled": "15:00:00",
            "priorityLevel": "medium",
            "symptoms": "Experiencing headaches and fatigue for the past week",
            "hasAdvice": false
        },
        {
            "id": "71bd45ee-d6c2-49a0-963d-1b8fa2b336e9",
            "userId": "41b1ce63-2e35-49db-86ba-085a60faca9c",
            "status": "pending",
            "dateRequested": "2025-06-25T08:39:25.601Z",
            "dateScheduled": "2025-06-26T00:00:00.000Z",
            "timeScheduled": "14:40:00",
            "priorityLevel": "medium",
            "symptoms": "Experiencing headaches and fatigue for the past week",
            "hasAdvice": false
        },
        {
            "id": "8d382835-65b6-4ac4-94c3-1cc3960babd2",
            "userId": "41b1ce63-2e35-49db-86ba-085a60faca9c",
            "status": "pending",
            "dateRequested": "2025-06-25T08:26:51.743Z",
            "dateScheduled": "2025-06-27T08:26:51.743Z",
            "timeScheduled": "10:00:00",
            "priorityLevel": "medium",
            "symptoms": "Headache and fever",
            "hasAdvice": true
        }
    ],
    "studentId": "41b1ce63-2e35-49db-86ba-085a60faca9c",
    "totalCount": 3,
    "message": "Student appointments retrieved successfully"
}
```
---
## 📋 Medical Staff Routes Usage & Body Requirements

Based on the route: `/api/medical-staff/*` (all routes require medical staff authentication)

---

### 1. **GET /api/medical-staff/profile**
**Purpose**: Get medical staff's own profile  
**Method**: `GET`  
**Body**: None (no body required)  
**Response**:
```json
{
  "success": true,
  "staff": {
    "user_id": "uuid",
    "name": "Dr. John Smith",
    "email": "john@example.com",
    "gender": "male",
    "age": 35,
    "specialty": "Mental Health Counselor",
    "staff_id": "uuid"
  }
}
```

---

### 2. **PATCH /api/medical-staff/profile**
**Purpose**: Update medical staff's own profile  
**Method**: `PATCH`  
**Body**:
```json
{
  "name": "string (optional)",
  "gender": "male|female|other (optional)",
  "age": "integer 1-120 (optional)", 
  "specialty": "string (optional)"
}
```
**Example**:
```json
{
  "name": "Dr. Jane Smith",
  "age": 32,
  "specialty": "Clinical Psychologist"
}
```

---

### 3. **GET /api/medical-staff/students**
**Purpose**: Get all student profiles  
**Method**: `GET`  
**Body**: None (no body required)  
**Response**:
```json
{
  "success": true,
  "students": [
    {
      "user_id": "uuid",
      "name": "Student Name",
      "email": "student@example.com",
      "gender": "female",
      "age": 20
    }
  ],
  "count": 1
}
```

---

### 4. **GET /api/medical-staff/students/:studentId**
**Purpose**: Get specific student profile by ID  
**Method**: `GET`  
**Body**: None (no body required)  
**URL Parameter**: `studentId` (user_id of the student)  
**Response**:
```json
{
  "success": true,
  "student": {
    "user_id": "uuid",
    "name": "Student Name",
    "email": "student@example.com",
    "gender": "female",
    "age": 20
  }
}
```

---

### 5. **GET /api/medical-staff/appointments/pending**
**Purpose**: Get all pending appointments for review  
**Method**: `GET`  
**Body**: None (no body required)  
**Response**:
```json
{
  "appointments": [
    {
      "id": "uuid",
      "userId": "uuid",
      "status": "pending",
      "dateRequested": "2025-06-25T10:00:00.000Z",
      "dateScheduled": "2025-06-26",
      "timeScheduled": "14:20:00",
      "priorityLevel": "medium",
      "symptoms": "Feeling anxious about exams"
    }
  ]
}
```

---

### 6. **POST /api/medical-staff/appointments/:appointmentId/approve**
**Purpose**: Approve an appointment (optionally reschedule)  
**Method**: `POST`  
**URL Parameter**: `appointmentId`  
**Body** (all optional):
```json
{
  "dateScheduled": "2025-06-26 (optional - YYYY-MM-DD)",
  "timeScheduled": "14:20:00 (optional - HH:MM:SS or HH:MM)",
  "advice": "string (optional - immediate advice message)"
}
```
**Examples**:
```json
// Simple approval (no rescheduling)
{}

// Approval with rescheduling
{
  "dateScheduled": "2025-06-27",
  "timeScheduled": "15:30:00"
}

// Approval with advice
{
  "advice": "Please bring any relevant medical documents to your appointment."
}
```

---

### 7. **POST /api/medical-staff/appointments/:appointmentId/reject**
**Purpose**: Reject an appointment  
**Method**: `POST`  
**URL Parameter**: `appointmentId`  
**Body**:
```json
{
  "reason": "string (optional - reason for rejection)"
}
```
**Examples**:
```json
// Simple rejection
{}

// Rejection with reason
{
  "reason": "Unfortunately, I'm not available at the requested time. Please reschedule for a different time slot."
}
```

---

### 8. **GET /api/medical-staff/advice/sent**
**Purpose**: Get all advice sent by this medical staff  
**Method**: `GET`  
**Body**: None (no body required)  
**Response**:
```json
{
  "advice": [
    {
      "advice_id": "uuid",
      "appointment_id": "uuid",
      "message": "Try some relaxation techniques...",
      "sent_at": "2025-06-25T10:00:00.000Z",
      "student_name": "John Doe"
    }
  ],
  "count": 1,
  "message": "Sent advice retrieved successfully"
}
```

---

### 9. **POST /api/medical-staff/appointments/:appointmentId**
**Purpose**: Send advice for a specific appointment  
**Method**: `POST`  
**URL Parameter**: `appointmentId`  
**Body**:
```json
{
  "message": "string (required - advice message)"
}
```
**Example**:
```json
{
  "message": "Try practicing deep breathing exercises for 10 minutes daily. Also, consider joining our stress management workshop next week."
}
```

---

## 🔐 Authentication Requirements
All routes require:
- **Authorization Header**: `Bearer <jwt_token>`
- **Role**: `medical_staff` or `admin`
- The JWT token must contain valid user information

---

## 🔧 Infrastructure APIs

### Health Check
- **GET** `/api/health`
- **Auth**: None
- **Response**: `{ message, timestamp }`

### Database Test
- **GET** `/api/test-db`
- **Auth**: None
- **Response**: `{ message }`

---

## 👨‍💼 Admin APIs

### User Management
- **GET** `/api/admin/users/students` - Get all student profiles
- **GET** `/api/admin/users/medical-staff` - Get all medical staff profiles
- **PATCH** `/api/admin/users/:userId/role` - Update user role
- **PATCH** `/api/admin/users/:userId/status` - Update user status
- **Auth**: Bearer Token (Admin only)

### Appointment Management
- **GET** `/api/admin/appointments` - Get all appointments
- **POST** `/api/admin/appointments/users/:userId` - Create appointment for user
- **PATCH** `/api/admin/appointments/:appointmentId` - Update any appointment
- **Auth**: Bearer Token (Admin only)
 

### Mood Tracker Management
- **GET** `/api/admin/mood-entries` - Get all mood entries
- **POST** `/api/admin/mood-entries/users/:userId` - Create mood entry for user
- **PATCH** `/api/admin/mood-entries/:entryId` - Update mood entry
- **Auth**: Bearer Token (Admin only)
 

### Temporary Advice Management
- **GET** `/api/admin/temporary-advice` - Get all advice
- **POST** `/api/admin/temporary-advice/appointments/:appointmentId` - Create advice
- **PATCH** `/api/admin/temporary-advice/:adviceId` - Update advice
- **DELETE** `/api/admin/temporary-advice/:adviceId` - Delete advice
- **Auth**: Bearer Token (Admin only)
 

### Abuse Reports Management
- **GET** `/api/admin/abuse-reports` - Get all reports
- **POST** `/api/admin/abuse-reports` - Create abuse report
- **PATCH** `/api/admin/abuse-reports/:reportId` - Update report
- **DELETE** `/api/admin/abuse-reports/:reportId` - Delete report
- **Auth**: Bearer Token (Admin only)
 

---

## 📋 Mood Entry Routes Usage & Body Requirements

Based on the route: `/api/mood-entries/*` (all routes require authentication)

---

### 1. **POST /api/mood-entries/**
**Purpose**: Create a new mood entry (students only)  
**Method**: `POST`  
**Authorization**: Student role required  
**Body**:
```json
{
  "mood": "happy|sad|neutral|anxious|stressed (required)",
  "notes": "string (optional)"
}
```
**Examples**:
```json
// Basic mood entry
{
  "mood": "anxious"
}

// Mood entry with notes
{
  "mood": "stressed",
  "notes": "Feeling overwhelmed with upcoming exams and assignments"
}
```
**Response**:
```json
{
    "moodEntry": {
        "id": "bf9aa589-0c44-4173-96ef-b5e13577c147",
        "mood": "anxious",
        "entry_date": "2025-06-24T21:18:20.590Z",
        "notes": null,
        "user_id": "b88e6bc7-4c15-46e3-9404-f06c1ce9a58d"
    }
}
```

---

### 2. **GET /api/mood-entries/**
**Purpose**: Get all mood entries for the authenticated student  
**Method**: `GET`  
**Authorization**: Student role required  
**Body**: None (no body required)  
**Response**:
```json
{
    "moodEntries": [
        {
            "id": "bf9aa589-0c44-4173-96ef-b5e13577c147",
            "mood": "anxious",
            "entry_date": "2025-06-24T21:18:20.590Z",
            "notes": null,
            "user_id": "b88e6bc7-4c15-46e3-9404-f06c1ce9a58d"
        }
    ]
}
```

---

### 3. **PATCH /api/mood-entries/:entryId**
**Purpose**: Update a mood entry (students can only update their own)  
**Method**: `PATCH`  
**Authorization**: Student role required  
**URL Parameter**: `entryId` (mood entry ID)  
**Body** (at least one field required):
```json
{
  "mood": "happy|sad|neutral|anxious|stressed (optional)",
  "notes": "string (optional)"
}
```
**Examples**:
```json
// Update only mood
{
  "mood": "neutral"
}

// Update only notes
{
  "notes": "Feeling better after talking to a friend"
}

// Update both
{
  "mood": "happy",
  "notes": "Great day after getting good grades!"
}
```
**Response**:
```json
{
  "moodEntry": {
    "id": "entry_uuid",
    "mood": "happy",
    "entry_date": "2025-06-25T10:00:00.000Z",
    "notes": "Great day after getting good grades!",
    "user_id": "uuid"
  }
}
```

---

### 4. **PUT /api/mood-entries/:entryId**
**Purpose**: Update a mood entry (same as PATCH - alternative method)  
**Method**: `PUT`  
**Authorization**: Student role required  
**URL Parameter**: `entryId` (mood entry ID)  
**Body**: Same as PATCH method above
**Response**: Same as PATCH method above

---

### 5. **DELETE /api/mood-entries/:entryId**
**Purpose**: Delete a mood entry (students can only delete their own)  
**Method**: `DELETE`  
**Authorization**: Student role required  
**URL Parameter**: `entryId` (mood entry ID)  
**Body**: None (no body required)  
**Response**:
```json
{
  "success": true,
  "message": "Mood entry deleted successfully"
}
```

---

### 6. **GET /api/mood-entries/student/:studentUserId**
**Purpose**: Get all mood entries for a specific student (medical staff only)  
**Method**: `GET`  
**Authorization**: Medical staff role required + must have appointment with the student  
**URL Parameter**: `studentUserId` (user ID of the student)  
**Body**: None (no body required)  
**Response**:
```json
{
    "moodEntries": [
        {
            "id": "0e4de773-7ca3-4b08-b4e3-74c962ba1cc6",
            "mood": "sad",
            "entry_date": "2025-06-24T21:34:16.003Z",
            "notes": null,
            "user_id": "0b8ee28d-3f0b-47bd-b3ff-a8429835616e"
        }
    ]
}
```

---

### 🔐 Authentication & Authorization

#### Authentication Requirements:
- **Authorization Header**: `Bearer <jwt_token>`
- Uses `requireAppointmentAccess` middleware

#### Role-Based Access:
- **Students**: Can create, read, update, and delete their own mood entries
- **Medical Staff**: Can only read mood entries of students they have appointments with
- **Admin**: Not explicitly mentioned in these routes

---

### 📊 Mood Values
Valid mood values are:
- `happy`
- `sad` 
- `neutral`
- `anxious`
- `stressed`

---

### 💡 Usage Notes

1. **Student Workflow**: Students can track their daily mood and add personal notes
2. **Medical Staff Access**: Medical staff can only view mood entries of students they have appointments with (privacy protection)
3. **Update Flexibility**: Both PATCH and PUT methods are available for updates
4. **Privacy**: Strict role-based access ensures mood entries remain private between students and their assigned medical staff
---

## 📋 Notification Routes Usage & Body Requirements

Based on the route: `/api/notifications/*` (all routes require authentication)

---

### 1. **GET /api/notifications/**
**Purpose**: Get notifications for the authenticated user with optional filtering  
**Method**: `GET`  
**Authorization**: Any authenticated user  
**Body**: None (no body required)  
**Query Parameters** (all optional):
- `limit` - Number of notifications to return (default: 20)
- `offset` - Number of notifications to skip (default: 0)
- `unreadOnly` - Return only unread notifications (default: false)
- `type` - Filter by notification type (optional)

**Example Requests**:
```http
GET /api/notifications/
GET /api/notifications/?limit=10&offset=0
GET /api/notifications/?unreadOnly=true
GET /api/notifications/?type=appointment&limit=5
```

**Example Response**:
```json
{
    "notifications": [
        {
            "id": "75bf93dc-87e6-4472-a6b0-313b05df4a09",
            "userId": "c9184e81-46b4-4a1e-adf3-8fe6aac25ffa",
            "appointmentId": "c8dceb3a-2fef-49f6-acde-1b5341590554",
            "type": "appointment_assigned",
            "title": "New Appointment Assigned",
            "message": "You have been assigned a new appointment from Nguyen Van A. Symptoms: Experiencing headaches and fatigue for the past week",
            "isRead": false,
            "createdAt": "2025-06-25T04:08:08.489Z",
            "readAt": null
        }
    ],
    "count": 1,
    "hasMore": false,
    "message": "Notifications retrieved successfully"
}
```

---

### 2. **GET /api/notifications/count**
**Purpose**: Get unread notification count for the authenticated user  
**Method**: `GET`  
**Authorization**: Any authenticated user  
**Body**: None (no body required)  
**Exampl Response**:
```json
{
  "unreadCount": 5,
  "message": "Unread count retrieved successfully"
}
```

---

### 3. **PATCH /api/notifications/:notificationId/read**
**Purpose**: Mark a specific notification as read  
**Method**: `PATCH`  
**Authorization**: User can only mark their own notifications as read  
**URL Parameter**: `notificationId` (notification UUID)  
**Body**: None (no body required)  
**Response**:
```json
{
    "notification": {
        "id": "75bf93dc-87e6-4472-a6b0-313b05df4a09",
        "isRead": true,
        "readAt": "2025-06-25T04:13:00.151Z"
    },
    "message": "Notification marked as read"
}
```

---

### 4. **PATCH /api/notifications/read-all**
**Purpose**: Mark all notifications as read for the authenticated user  
**Method**: `PATCH`  
**Authorization**: Any authenticated user  
**Body**: None (no body required)  
**Response**:
```json
{
  "updatedCount": 7,
  "message": "7 notifications marked as read"
}
```

---

### 5. **DELETE /api/notifications/:notificationId**
**Purpose**: Delete a specific notification  
**Method**: `DELETE`  
**Authorization**: User can only delete their own notifications  
**URL Parameter**: `notificationId` (notification UUID)  
**Body**: None (no body required)  
**Response**:
```json
{
    "message": "Notification deleted successfully"
}
```

---

## 🔔 Notification Types

The system supports various notification types:
- `appointment_approved` - When an appointment is approved
- `appointment_rejected` - When an appointment is rejected
- `appointment_cancelled` - When an appointment is cancelled
- `appointment_assigned` - When new appointment is assigned to the doctor
- `general` - General notifications (e.g., system updates, reminders)

---

## 🔐 Authentication & Authorization

### Authentication Requirements:
- **Authorization Header**: `Bearer <jwt_token>`
- Uses standard `authMiddleware`

### Privacy Protection:
- Users can only access their own notifications
- UUID validation ensures security
- No cross-user data leakage

---

## 📊 Pagination & Filtering

### Query Parameters:
- **limit**: Control number of results (useful for pagination)
- **offset**: Skip results for pagination
- **unreadOnly**: Filter to show only unread notifications
- **type**: Filter by specific notification type

### Pagination Example:
```javascript
// Get first 10 notifications
GET /api/notifications/?limit=10&offset=0

// Get next 10 notifications
GET /api/notifications/?limit=10&offset=10

// Get only unread notifications
GET /api/notifications/?unreadOnly=true&limit=5
```

---

## 💡 Usage Notes

1. **Real-time Updates**: Notifications are created automatically by the system for various events
2. **User Privacy**: Each user can only see their own notifications
3. **Read Status Tracking**: System tracks when notifications are read
4. **Bulk Operations**: Users can mark all notifications as read at once
5. **Flexible Filtering**: Support for filtering by read status and notification type
6. **Pagination Support**: Handle large numbers of notifications efficiently
7. **Metadata**: Notifications include relevant metadata (appointment IDs, staff names, etc.)

## 🔄 Typical Workflow

1. **Receive Notifications**: System automatically creates notifications for user events
2. **Check Count**: Frontend can check unread count for badge display
3. **List Notifications**: User views their notifications with filtering/pagination
4. **Mark as Read**: User reads notifications (individually or all at once)
5. **Delete**: User can delete notifications they no longer need
---

## 📋 Advice Routes Usage & Body Requirements

Based on the route: `/api/advice/*` (all routes require authentication)

---

### 1. **POST /api/advice/appointments/:appointmentId**
**Purpose**: Send advice for a specific appointment (medical staff only)  
**Method**: `POST`  
**Authorization**: Medical staff role required  
**URL Parameter**: `appointmentId` (appointment UUID)  
**Body**:
```json
{
  "message": "string (required - advice message)"
}
```
**Example**:
```json
{
  "message": "Try practicing deep breathing exercises for 10 minutes daily. Consider joining our stress management workshop next week. If symptoms persist, please schedule a follow-up appointment."
}
```
**Response**:
```json
{
    "message": "Advice sent successfully",
    "advice": {
        "id": "70104d47-2bd4-4382-b802-b10faa0119a6",
        "appointmentId": "f6594821-d17c-4ae2-a27e-fec64d0fc24a",
        "message": "Try practicing deep breathing exercises for 10 minutes daily. Consider joining our stress management workshop next week. If symptoms persist, please schedule a follow-up appointment.",
        "dateSent": "2025-06-24T21:42:28.006Z"
    }
}
```

---

### 2. **GET /api/advice/appointments/:appointmentId**
**Purpose**: Get advice for a specific appointment  
**Method**: `GET`  
**Authorization**: 
- Students can view advice for their own appointments
- Medical staff can view advice they sent
**URL Parameter**: `appointmentId` (appointment UUID)  
**Body**: None (no body required)  
**Response**:
```json
{
    "advice": [
        {
            "id": "70104d47-2bd4-4382-b802-b10faa0119a6",
            "message": "Try practicing deep breathing exercises for 10 minutes daily. Consider joining our stress management workshop next week. If symptoms persist, please schedule a follow-up appointment.",
            "dateSent": "2025-06-24T21:42:28.006Z",
            "appointmentId": "f6594821-d17c-4ae2-a27e-fec64d0fc24a",
            "symptoms": "Experiencing headaches and fatigue for the past week",
            "staffName": "New Doctor Name"
        },
        {
            "id": "4dae1ea3-5c1e-4ac9-9712-153a37e2bfbb",
            "message": "Try practicing deep breathing exercises for 10 minutes daily. Also, consider joining our stress management workshop next week.",
            "dateSent": "2025-06-24T21:10:17.639Z",
            "appointmentId": "f6594821-d17c-4ae2-a27e-fec64d0fc24a",
            "symptoms": "Experiencing headaches and fatigue for the past week",
            "staffName": "New Doctor Name"
        }
    ],
    "message": "Advice retrieved successfully"
}
```

---

### 3. **PUT /api/advice/appointments/:appointmentId**
**Purpose**: Update advice for a specific appointment (medical staff only)  
**Method**: `PUT`  
**Authorization**: Medical staff role required (can only update advice they sent. If there are multiple pieces of advice, all will be updated with the same message)  
**URL Parameter**: `appointmentId` (appointment UUID)  
**Body**:
```json
{
  "message": "string (required - updated advice message)"
}
```
**Example**:
```json
{
  "message": "Updated: Try practicing deep breathing exercises for 15 minutes daily instead of 10. Also, I recommend scheduling weekly check-ins for the next month."
}
```
**Response**:
```json
{
    "message": "Advice updated successfully",
    "advice": {
        "id": "4dae1ea3-5c1e-4ac9-9712-153a37e2bfbb",
        "appointmentId": "f6594821-d17c-4ae2-a27e-fec64d0fc24a",
        "message": "Updated: Try practicing deep breathing exercises for 15 minutes daily instead of 10. Also, I recommend scheduling weekly check-ins for the next month.",
        "dateSent": "2025-06-24T21:47:03.667Z"
    }
}
```

---

### 4. **GET /api/advice/student**
**Purpose**: Get all advice received by the current student  
**Method**: `GET`  
**Authorization**: Student role required  
**Body**: None (no body required)  
**Response**:
```json
{
  "advice": [
    {
      "id": "4dae1ea3-5c1e-4ac9-9712-153a37e2bfbb",
      "message": "Try practicing deep breathing exercises for 10 minutes daily. Also, consider joining our stress management workshop next week.",
      "dateSent": "2025-06-24T21:10:17.639Z",
      "appointmentId": "f6594821-d17c-4ae2-a27e-fec64d0fc24a",
      "symptoms": "Experiencing headaches and fatigue for the past week",
      "staffName": "New Doctor Name"
    }
  ],
  "count": 1,
  "message": "Advice retrieved successfully"
}
```

---

### 5. **GET /api/advice/sent**
**Purpose**: Get all advice sent by the current medical staff  
**Method**: `GET`  
**Authorization**: Medical staff role required  
**Body**: None (no body required)  
**Response**:
```json
{
  "advice": [
    {
      "advice_id": "uuid",
      "appointment_id": "uuid",
      "sent_to": "uuid",
      "student_name": "John Doe",
      "message": "Try practicing deep breathing exercises...",
      "sent_at": "2025-06-25T10:00:00.000Z",
      "appointment_date": "2025-06-26",
      "appointment_time": "14:20:00"
    },
    {
      "advice_id": "uuid", 
      "appointment_id": "uuid",
      "sent_to": "uuid",
      "student_name": "Jane Smith",
      "message": "Consider joining our stress management workshop...",
      "sent_at": "2025-06-24T14:00:00.000Z",
      "appointment_date": "2025-06-25",
      "appointment_time": "11:00:00"
    }
  ],
  "count": 2,
  "message": "Sent advice retrieved successfully"
}
```

---

### 🔐 Authentication & Authorization

#### Authentication Requirements:
- **Authorization Header**: `Bearer <jwt_token>`
- Uses standard `authMiddleware`

#### Role-Based Access:
- **Medical Staff**: Can send, update, and view advice they sent
- **Students**: Can only view advice they received
- **Admin**: Access not explicitly defined in these routes

---

### 🔄 Advice Workflow

1. **Medical Staff Sends Advice**: After reviewing an appointment, medical staff can send personalized advice
2. **Student Receives Advice**: Students can view all advice they've received from their appointments
3. **Medical Staff Updates**: Medical staff can update advice they previously sent
4. **Medical Staff Reviews**: Medical staff can see all advice they've sent to track their guidance

---

### 💡 Usage Notes

1. **Advice Linkage**: All advice is linked to specific appointments for context
2. **Privacy Protection**: Students can only see advice for their appointments, medical staff can only update their own advice
3. **Real-time Communication**: Provides a way for medical staff to give guidance outside of appointments
4. **Update Capability**: Medical staff can refine their advice after sending it
5. **Tracking**: Both students and medical staff can track advice history
6. **Message Validation**: All advice messages are trimmed and validated to ensure meaningful content

---

## 📋 Abuse Report Routes Usage & Body Requirements

Based on the route: `/api/abuse-reports/*` (all routes require authentication)

---

### 1. **POST /api/abuse-reports/**
**Purpose**: Create a new abuse report (medical staff only)  
**Method**: `POST`  
**Authorization**: Medical staff role required  
**Body**:
```json
{
  "appointmentId": "string (UUID, required)",
  "description": "string (required)",
  "reportType": "system_abuse|false_urgency|inappropriate_behavior|other (optional - default: system_abuse)"
}
```
**Examples**:
```json
// Basic abuse report
{
  "appointmentId": "f6594821-d17c-4ae2-a27e-fec64d0fc24a",
  "description": "Student has been consistently booking appointments and not showing up, wasting medical resources."
}

// Abuse report with type
{
  "appointmentId": "f6594821-d17c-4ae2-a27e-fec64d0fc24a",
  "description": "Student appears to be using the system to book multiple appointments without valid medical concerns.",
  "reportType": "system_abuse"
}
```
**Response**:
```json
{
    "success": true,
    "message": "Abuse report submitted successfully",
    "report": {
        "id": "c551961e-7c7f-42b8-b668-97541470f368",
        "appointmentId": "4f747468-3f70-4e5c-8946-66dca40607fe",
        "description": "Student has been consistently booking appointments and not showing up, wasting medical resources.",
        "reportType": "system_abuse",
        "reportDate": "2025-06-25T05:20:19.002Z",
        "status": "open"
    }
}
```

---

### 2. **GET /api/abuse-reports/my**
**Purpose**: Get all abuse reports created by the current medical staff  
**Method**: `GET`  
**Authorization**: Medical staff role required  
**Body**: None (no body required)  
**Response**:
```json
{
    "success": true,
    "message": "Abuse reports retrieved successfully",
    "reports": [
        {
            "id": "c551961e-7c7f-42b8-b668-97541470f368",
            "reportDate": "2025-06-25T05:20:19.002Z",
            "description": "Student has been consistently booking appointments and not showing up, wasting medical resources.",
            "status": "open",
            "reportType": "system_abuse",
            "appointmentId": "4f747468-3f70-4e5c-8946-66dca40607fe",
            "studentId": "bb8a1c22-b7d5-46c5-b000-29501da50966",
            "studentName": "Nguyen Van A",
            "studentEmail": "student1@vgu.edu.vn",
            "appointmentSymptoms": "Headache and fever",
            "appointmentPriority": "medium"
        }
    ],
    "count": 1
}
```

---

### 3. **PATCH /api/abuse-reports/:reportId**
**Purpose**: Update an abuse report (medical staff can only update their own)  
**Method**: `PATCH`  
**Authorization**: Medical staff role required  
**URL Parameter**: `reportId` (abuse report ID)  
**Body**:
```json
{
  "description": "string (optional - updated description)"
}
```
**Examples**:
```json
// Update description
{
  "description": "Updated: Student has been consistently booking appointments and not showing up. After review, this appears to be a pattern of system abuse affecting other students' access to care."
}
```
**Response**:
```json
{
    "success": true,
    "message": "Abuse report updated successfully",
    "report": {
        "report_id": "c551961e-7c7f-42b8-b668-97541470f368",
        "description": "Updated: Student has been consistently booking appointments and not showing up. After review, this appears to be a pattern of system abuse affecting other students' access to care.",
        "report_date": "2025-06-25T05:20:19.002Z",
        "status": "open"
    }
}
```

---

### 🔐 Authentication & Authorization

#### Authentication Requirements:
- **Authorization Header**: `Bearer <jwt_token>`
- Uses `authMiddleware` and `requireRole('medical_staff')`

#### Role-Based Access:
- **Medical Staff**: Can create, read, and update their own abuse reports
- **Students**: No access to abuse report routes
- **Admin**: Has separate admin routes for managing all abuse reports

---

### 🔄 Typical Workflow

1. **Complete Appointment**: Medical staff completes an appointment with a student
2. **Identify Abuse**: Staff identifies potential system abuse (no-shows, fake symptoms, etc.)
3. **Create Report**: Staff creates an abuse report linked to the specific appointment
4. **Review Reports**: Staff can view all their submitted reports
5. **Update if Needed**: Staff can update report descriptions if additional information becomes available
6. **Administrative Review**: Administrators can review all reports through separate admin routes

---

### 📝 Technical Notes for Frontend Developers
1. **Authentication**: JWT tokens expire in 24 hours - implement refresh logic
2. **Base URL**: All APIs use `/api` prefix (e.g., `/api/appointments`)
3. **Error Handling**: Use status codes 401, 403, 400, 404, 500 for proper UX
4. **Role Management**: Three roles - `student`, `medical_staff`, `admin`
5. **Profile Fields**: New fields `housingLocation` (students) and `shiftSchedule` (medical staff)
6. **Appointment Logic**: 20-minute slots, 9AM-4PM, Monday-Friday only
7. **Auto-Assignment**: Appointments automatically assigned to least busy medical staff
8. **Notifications**: Poll `/notifications/count` for unread badge updates
9. **Time Slots**: Always check availability before showing booking options
10. **Validation**: Frontend should match backend validation (housing enums, time formats)

---

### 📋 **Integration Checklist**

- ✅ **Use correct base URL**: `http://localhost:5001/api`
- ✅ **Include Bearer token**: `Authorization: Bearer ${token}`
- ✅ **Use proper headers**: `Content-Type: application/json`
- ✅ **Handle 401 errors**: Redirect to login and clear storage
- ✅ **Validate responses**: Check `response.ok` before parsing JSON
- ✅ **Use template literals**: Backticks for `${variable}` interpolation
- ✅ **Check time slot availability**: Before creating appointments
- ✅ **Implement loading states**: Show loading indicators during API calls
- ✅ **Handle errors gracefully**: Show user-friendly error messages
- ✅ **Use React hooks**: For data fetching and state management

### 🚨 **Common Pitfalls to Avoid**

1. **String concatenation with +**: `+ 'http://...'` creates NaN
2. **Wrong header names**: `Auth` instead of `Authorization`
3. **Missing plurals**: `header` instead of `headers`
4. **Template literal syntax**: Single quotes instead of backticks
5. **Port number confusion**: Using 5000 instead of 5001
6. **Missing error handling**: Not checking `response.ok`
7. **Token management**: Not refreshing expired tokens
8. **Time slot validation**: Creating appointments without checking availability

---

## �🚀 Frontend Development Recommendations

### State Management Suggestions
```javascript
// Recommended user state structure
const userState = {
  isAuthenticated: false,
  token: null,
  user: {
    id: null,
    email: null,
    role: null, // 'student', 'medical_staff', 'admin'
    name: null,
    // Role-specific fields
    housingLocation: null, // for students
    shiftSchedule: null,   // for medical staff
  },
  notifications: {
    unreadCount: 0,
    items: []
  }
};
```

### Component Architecture
```javascript
// Recommended component structure for appointments
const AppointmentBooking = () => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  const loadAvailableSlots = async (date) => {
    try {
      const response = await apiCall(`/appointments/time-slots/${date}`);
      const data = await response.json();
      setAvailableSlots(data.availableTimeSlots);
    } catch (error) {
      // Handle error
    }
  };
  
  // ... rest of component
};
```

### Real-time Updates
```javascript
// Polling pattern for notifications
const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const response = await apiCall('/notifications/count');
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };
    
    pollNotifications(); // Initial load
    const interval = setInterval(pollNotifications, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return { unreadCount };
};
```

### Form Validation Patterns
```javascript
// Profile form validation to match backend
const validateProfile = (formData, userRole) => {
  const errors = {};
  
  if (userRole === 'student' && formData.housingLocation) {
    const validHousing = ['dorm_1', 'dorm_2', 'off_campus'];
    if (!validHousing.includes(formData.housingLocation)) {
      errors.housingLocation = 'Please select a valid housing option';
    }
  }
  
  if (userRole === 'medical_staff' && formData.shiftSchedule) {
    // Validate shift schedule format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    Object.values(formData.shiftSchedule).forEach(shifts => {
      shifts.forEach(shift => {
        if (!timeRegex.test(shift)) {
          errors.shiftSchedule = 'Invalid time format. Use HH:MM-HH:MM';
        }
      });
    });
  }
  
  return errors;
};
```

---

**Last Updated**: June 23, 2025  
**API Version**: 1.0  
**Frontend Integration**: Ready ✅

