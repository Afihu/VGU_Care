# VGU Care - API Documentation

**Base URL**: `http://localhost:5001/api`  

## 📚 Quick Reference for Frontend Developers

### Essential API Endpoints (Copy-Paste Ready)

```javascript
// Base Configuration
const API_BASE_URL = 'http://localhost:5001/api';

// Get authentication token
const getToken = () => {
    const sessionInfo = localStorage.getItem('session-info');
    return sessionInfo ? JSON.parse(sessionInfo).token : null;
};

// Generic API call
const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    });
    
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('session-info');
            window.location.href = '/login';
        }
        throw new Error(`HTTP ${response.status}`);
    }
    return response;
};
```

### Most Used API Calls

```javascript
// Authentication
const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    localStorage.setItem('session-info', JSON.stringify(data));
    return data;
};

// Get user appointments
const getAppointments = async () => {
    const response = await apiCall('/appointments');
    return response.json();
};

// Get available time slots
const getTimeSlots = async (date) => {
    const response = await apiCall(`/appointments/time-slots/${date}`);
    return response.json();
};

// Create appointment
const createAppointment = async (symptoms, priorityLevel, date, time) => {
    const response = await apiCall('/appointments', {
        method: 'POST',
        body: JSON.stringify({
            symptoms,
            priorityLevel,
            dateScheduled: date,
            timeScheduled: time
        })
    });
    return response.json();
};

// Get mood entries
const getMoodEntries = async () => {
    const response = await apiCall('/mood-entries');
    return response.json();
};

// Create mood entry
const createMoodEntry = async (mood, notes, intensity) => {
    const response = await apiCall('/mood-entries', {
        method: 'POST',
        body: JSON.stringify({ mood, notes, intensity })
    });
    return response.json();
};

// Get notifications count
const getNotificationCount = async () => {
    const response = await apiCall('/notifications/count');
    return response.json();
};

// Get user profile
const getProfile = async () => {
    const response = await apiCall('/users/me');
    return response.json();
};
```

### Error Handling Template

```javascript
const handleApiCall = async (apiFunction, ...args) => {
    try {
        return await apiFunction(...args);
    } catch (error) {
        console.error('API Error:', error);
        
        // Show user-friendly message
        if (error.message.includes('401')) {
            alert('Please log in again');
        } else if (error.message.includes('403')) {
            alert('You do not have permission for this action');
        } else if (error.message.includes('404')) {
            alert('Resource not found');
        } else {
            alert('Something went wrong. Please try again.');
        }
        
        throw error;
    }
};

// Usage:
const loadAppointments = async () => {
    try {
        const appointments = await handleApiCall(getAppointments);
        setAppointments(appointments.appointments);
    } catch (error) {
        // Error already handled by handleApiCall
    }
};
```
---

## 🔐 Authentication APIs

### Login
- **POST** `/api/login`
- **Body**: `{ email: "string", password: "string" }`
- **Response**: 
```javascript
{
  "message": "Login successful",
  "user": { 
    "id": "uuid",
    "email": "student@vgu.edu.vn", 
    "role": "student", // Possible values: "student", "medical_staff", "admin"
    "status": "active" // Possible values: "active", "inactive", "banned"
  }, 
  "token": "jwt_token_string"
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
- **Response**: 
```javascript
{
  "message": "User account created successfully", 
  "user": { 
    "id": "uuid", 
    "email": "student@vgu.edu.vn", 
    "role": "student", // "student", "medical_staff", "admin"
    "status": "active" // Default: "active"
  }
}
```
- **Validation**:
  - Email must be from @vgu.edu.vn domain
  - All fields (email, password, name, gender, age, role) are required
  - Role must be one of: student, medical_staff, admin
  - Housing location must be valid enum if provided
  - Prevents duplicate email registration
- **Error Responses**:
  - `400`: Missing required fields, invalid email domain, invalid role, or user already exists
  - `500`: Server error during account creation

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
**Business Rules**:
- Monday-Friday only (weekends return empty array)
- 20-minute time slots from 9:00 AM to 4:00 PM
- Excludes already booked slots for the specified date
- Does not show slots for cancelled/rejected appointments  

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

---

## 🏥 Medical Staff APIs

### Get Medical Staff Profile
- **GET** `/api/medical-staff/profile`
- **Auth**: Bearer Token (Medical Staff only)
- **Response**: `{ success: true, user: { name, email, role, specialty, shiftSchedule, ... } }`

### Update Medical Staff Profile
- **PATCH** `/api/medical-staff/profile`
- **Auth**: Bearer Token (Medical Staff only)
- **Body**: `{ name?, specialty?, age?, gender?, shiftSchedule? }`
- **Response**: `{ success: true, user: { ... } }`

### Get All Student Profiles
- **GET** `/api/medical-staff/students`
- **Auth**: Bearer Token (Medical Staff only)
- **Response**: `{ success: true, students: [...], count: number }`

### Get Specific Student Profile
- **GET** `/api/medical-staff/students/:studentId`
- **Auth**: Bearer Token (Medical Staff only)
- **Response**: `{ success: true, student: { ... } }`

### Get Pending Appointments (Medical Staff)
**GET** `/api/medical-staff/appointments/pending`
```javascript
// Example Response:
{
  "appointments": [
    {
      "id": "uuid",
      "userId": "uuid",
      "status": "pending",
      "symptoms": "Headache and fever",
      "priorityLevel": "medium",
      "dateScheduled": "2025-06-20T00:00:00Z",
      "timeScheduled": "09:00:00"
    }
  ]
}
```
**Auth**: Bearer Token (Medical Staff only)  

### Approve Appointment (Medical Staff)
**POST** `/api/medical-staff/appointments/:appointmentId/approve`
```javascript
// Example Response:
{
  "message": "Appointment approved successfully",
  "appointment": {
    "id": "uuid",
    "status": "approved"
    // ...other details
  }
}
```
**Auth**: Bearer Token (Medical Staff only)  

### Reject Appointment (Medical Staff)
**POST** `/api/medical-staff/appointments/:appointmentId/reject`
```javascript
// Request Body (optional):
{
  "reason": "Scheduling conflict"
}

// Example Response:
{
  "message": "Appointment rejected successfully",
  "appointment": {
    "id": "uuid",
    "status": "rejected"
    // ...other details
  }
}
```
**Auth**: Bearer Token (Medical Staff only)  

### Get Sent Advice (Medical Staff)
**GET** `/api/medical-staff/advice/sent`
```javascript
// Example Response:
{
  "advice": [
    {
      "id": "uuid",
      "appointmentId": "uuid",
      "message": "Please rest and stay hydrated",
      "sentAt": "2025-06-24T10:30:00Z"
    }
  ]
}
```
**Auth**: Bearer Token (Medical Staff only)  

### Send Advice (Medical Staff Route)
**POST** `/api/medical-staff/appointments/:appointmentId`
```javascript
// Request Body:
{
  "message": "Please rest and drink plenty of fluids"
}

// Example Response:
{
  "message": "Advice sent successfully",
  "advice": {
    "id": "uuid",
    "appointmentId": "uuid",
    "message": "Please rest and drink plenty of fluids",
    "sentAt": "2025-06-24T10:30:00Z"
  }
}
```
**Auth**: Bearer Token (Medical Staff only)  

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

## 📋 Mood Tracker APIs

### Mood Entry Management
**POST** `/api/mood-entries`
```javascript
// Request Body:
{
  "mood": "happy",        // Required: "happy", "sad", "neutral", "anxious", "stressed"
  "notes": "Feeling good today!"  // Optional: Additional notes
}

// Example Response:
{
  "moodEntry": {
    "id": "uuid",
    "userId": "uuid",
    "studentId": "uuid",
    "mood": "happy", // Possible values: "happy", "sad", "neutral", "anxious", "stressed"
    "notes": "Feeling good today!",
    "entryDate": "2025-06-23T10:30:00Z"
  }
}
```
- **Auth**: Bearer Token (Student role only)
- **Response**: Created mood entry object
 

**GET** `/api/mood-entries`
```javascript
// Example Response:
{
  "moodEntries": [
    {
      "id": "uuid",
      "userId": "uuid",
      "studentId": "uuid",
      "mood": "happy", // Possible values: "happy", "sad", "neutral", "anxious", "stressed"
      "notes": "Feeling good today!",
      "entryDate": "2025-06-23T10:30:00Z"
    }
  ]
}
```
- **Auth**: Bearer Token (Student role only)
- **Response**: Object containing `moodEntries` array with own mood entries
 

**PATCH** `/api/mood-entries/:entryId` or **PUT** `/api/mood-entries/:entryId`
```javascript
// Request Body:
{
  "mood": "stressed",     // Optional: "happy", "sad", "neutral", "anxious", "stressed"
  "notes": "Updated notes"  // Optional: Updated notes
}

// Example Response:
{
  "moodEntry": {
    "id": "uuid",
    "userId": "uuid",
    "studentId": "uuid",
    "mood": "stressed", // Updated mood value
    "notes": "Updated notes",
    "entryDate": "2025-06-23T10:30:00Z"
  }
}
```
- **Auth**: Bearer Token (Student role only, ownership required)
- **Response**: Updated mood entry object
 

**DELETE** `/api/mood-entries/:entryId`
```javascript
// Example Response:
{
  "success": true,
  "message": "Mood entry deleted successfully"
}
```
- **Auth**: Bearer Token (Student role only, ownership required)
- **Response**: Success confirmation
 

**GET** `/api/mood-entries/student/:studentUserId`
```javascript
// Example Response:
{
  "moodEntries": [
    {
      "id": "uuid",
      "userId": "uuid",
      "studentId": "uuid",
      "mood": "happy", // Possible values: "happy", "sad", "neutral", "anxious", "stressed"
      "notes": "Feeling good today!",
      "entryDate": "2025-06-23T10:30:00Z"
    }
  ]
}
```
- **Auth**: Bearer Token (Medical Staff only)
- **Access**: Medical staff can only view mood entries for students they have appointments with
- **Response**: Object containing `moodEntries` array for specified student
 

### Mood Values
Valid mood values are:
- `"happy"`
- `"sad"`
- `"neutral"`
- `"anxious"`
- `"stressed"`

---

## 🔔 Notification APIs

### Get User Notifications
**GET** `/api/notifications`
```javascript
// Example Response:
{
  "notifications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "appointmentId": "uuid", // null if not appointment-related
      "type": "appointment_approved", // Possible values: "appointment_assigned", "appointment_approved", "appointment_rejected", "appointment_completed", "general"
      "title": "Appointment Scheduled",
      "message": "Your appointment has been scheduled for June 20, 2025",
      "isRead": false, // Possible values: true, false
      "createdAt": "2025-06-19T10:30:00Z",
      "readAt": null // null if not read, timestamp if read
    }
  ]
}
```
- **Auth**: Bearer Token (All roles)
- **Access**: User-specific notifications only
 

### Get Unread Count
**GET** `/api/notifications/count`
```javascript
// Example Response:
{
  "unreadCount": 3
}
```
- **Auth**: Bearer Token (All roles)
 

### Mark Notification as Read
**PATCH** `/api/notifications/:notificationId/read`
```javascript
// Example Response:
{
  "message": "Notification marked as read",
  "notification": {
    "id": "uuid",
    "userId": "uuid",
    "appointmentId": "uuid",
    "type": "appointment_approved", // "appointment_assigned", "appointment_approved", "appointment_rejected", "appointment_completed", "general"
    "title": "Appointment Scheduled",
    "message": "Your appointment has been scheduled for June 20, 2025",
    "isRead": true, // Now marked as read
    "createdAt": "2025-06-19T10:30:00Z",
    "readAt": "2025-06-19T11:00:00Z" // Timestamp when marked as read
  }
}
```
- **Auth**: Bearer Token (Ownership required)
 

### Mark All Notifications as Read
**PATCH** `/api/notifications/read-all`
```javascript
// Example Response:
{
  "message": "All notifications marked as read",
  "updatedCount": 5
}
```
- **Auth**: Bearer Token (All roles)
 

### Delete Notification
**DELETE** `/api/notifications/:notificationId`
```javascript
// Example Response:
{
  "message": "Notification deleted successfully"
}
```
- **Auth**: Bearer Token (Ownership required)
 

---

## 🎯 Frontend Integration Guide

### Authentication Flow
```javascript
// 1. Login
const login = async (email, password) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }
};

// 2. Include token in subsequent requests
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};
```

### Profile Management Integration
```javascript
// Get current user profile
const getProfile = async () => {
  const response = await apiCall('/users/me');
  return response.json();
};

// Update profile with new fields
const updateProfile = async (profileData) => {
  const response = await apiCall('/users/profile', {
    method: 'PATCH',
    body: JSON.stringify({
      name: profileData.name,
      age: profileData.age,
      roleSpecificData: {
        // For students
        housingLocation: profileData.housingLocation, // "dorm_1", "dorm_2", "off_campus"
        major: profileData.major,
        intakeYear: profileData.intakeYear,
        
        // For medical staff
        specialty: profileData.specialty,
        shiftSchedule: {
          monday: ["09:00-17:00"],
          tuesday: ["09:00-17:00", "18:00-22:00"],
          // ... other days
        }
      }
    })
  });
  return response.json();
};
```

### Appointment Booking Flow
```javascript
// Complete appointment booking flow
const bookAppointment = async (appointmentData) => {
  // 1. Get available time slots for selected date
  const slotsResponse = await apiCall(`/appointments/time-slots/${appointmentData.date}`);
  const { availableTimeSlots } = await slotsResponse.json();
  
  // 2. Show available slots to user
  if (availableTimeSlots.length === 0) {
    throw new Error('No available time slots for this date');
  }
  
  // 3. Create appointment with selected time slot
  const appointmentResponse = await apiCall('/appointments', {
    method: 'POST',
    body: JSON.stringify({
      symptoms: appointmentData.symptoms,
      priorityLevel: appointmentData.priorityLevel,
      dateScheduled: appointmentData.date,
      timeScheduled: appointmentData.selectedTime
    })
  });
  
  return appointmentResponse.json();
};
```

### Real-time Notifications
```javascript
// Get unread notification count for badge
const getUnreadCount = async () => {
  const response = await apiCall('/notifications/count');
  const { unreadCount } = await response.json();
  return unreadCount;
};

// Get all notifications with pagination
const getNotifications = async (page = 1, limit = 10) => {
  const response = await apiCall(`/notifications?page=${page}&limit=${limit}`);
  return response.json();
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  const response = await apiCall(`/notifications/${notificationId}/read`, {
    method: 'PATCH'
  });
  return response.json();
};
```

### Error Handling Pattern
```javascript
const handleApiError = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    switch (response.status) {
      case 401:
        // Token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;
      case 403:
        // Access denied
        throw new Error('You do not have permission to perform this action');
      case 400:
        // Validation error
        throw new Error(error.error || 'Invalid input');
      case 404:
        throw new Error('Resource not found');
      default:
        throw new Error('An unexpected error occurred');
    }
  }
  return response;
};

// Use with all API calls
const safeApiCall = async (endpoint, options = {}) => {
  const response = await apiCall(endpoint, options);
  await handleApiError(response);
  return response.json();
};
```

---

### 📊 Reports & Advice APIs

### Abuse Reports
- **GET** `/api/reports` - Get accessible reports (Medical Staff + Admin)
- **POST** `/api/reports` - Create abuse report (Medical Staff + Admin)
- **GET** `/api/reports/:reportId` - Get specific report
- **PATCH** `/api/reports/:reportId` - Update report
- **DELETE** `/api/reports/:reportId` - Delete report
- **Auth**: Bearer Token (Medical Staff + Admin only)
 

### Temporary Advice
- **GET** `/api/advice` - Get advice (All roles can view)
- **POST** `/api/advice` - Create advice (Medical Staff + Admin)
- **GET** `/api/advice/:adviceId` - Get specific advice
- **PATCH** `/api/advice/:adviceId` - Update advice (Medical Staff + Admin)
- **DELETE** `/api/advice/:adviceId` - Delete advice (Medical Staff + Admin)
- **Auth**: Bearer Token (Role-based access)
 

---

## � Complete Field Specifications

### User Fields
```javascript
{
  "id": "uuid",
  "email": "string (@vgu.edu.vn domain)",
  "role": "student" | "medical_staff" | "admin",
  "name": "string",
  "gender": "male" | "female" | "other",
  "age": "number (positive integer)",
  "status": "active" | "inactive" | "banned",
  "points": "number (integer, default: 0)",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

### Student-Specific Fields
```javascript
{
  "intakeYear": "number (year)",
  "major": "string",
  "housingLocation": "dorm_1" | "dorm_2" | "off_campus"
}
```

### Medical Staff-Specific Fields
```javascript
{
  "specialty": "string",
  "specialtyGroup": "physical" | "mental",
  "shiftSchedule": {
    "monday": ["HH:MM-HH:MM"],
    "tuesday": ["HH:MM-HH:MM"],
    // ... other days (optional)
  }
}
```

### Appointment Fields
```javascript
{
  "id": "uuid",
  "userId": "uuid",
  "medicalStaffId": "uuid | null",
  "status": "pending" | "approved" | "rejected" | "completed" | "cancelled",
  "dateRequested": "ISO 8601 timestamp",
  "dateScheduled": "ISO 8601 timestamp",
  "timeScheduled": "HH:MM:SS",
  "priorityLevel": "low" | "medium" | "high",
  "symptoms": "string (text)",
  "healthIssueType": "physical" | "mental"
}
```

### Mood Entry Fields
```javascript
{
  "id": "uuid",
  "userId": "uuid",
  "studentId": "uuid",
  "mood": "happy" | "sad" | "neutral" | "anxious" | "stressed",
  "notes": "string | null",
  "entryDate": "ISO 8601 timestamp",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

### Notification Fields
```javascript
{
  "id": "uuid",
  "userId": "uuid",
  "appointmentId": "uuid | null",
  "type": "appointment_assigned" | "appointment_approved" | "appointment_rejected" | "appointment_completed" | "general",
  "title": "string",
  "message": "string",
  "isRead": "boolean",
  "createdAt": "ISO 8601 timestamp",
  "readAt": "ISO 8601 timestamp | null"
}
```

### Abuse Report Fields
```javascript
{
  "id": "uuid",
  "staffId": "uuid",
  "studentId": "uuid | null",
  "appointmentId": "uuid | null",
  "reportType": "system_abuse" | "false_urgency" | "inappropriate_behavior" | "other",
  "description": "string",
  "status": "open" | "investigating" | "resolved",
  "reportDate": "ISO 8601 timestamp"
}
```

### Blackout Date Fields
```javascript
{
  "date": "YYYY-MM-DD",
  "reason": "string",
  "type": "holiday" | "maintenance" | "staff_training" | "emergency",
  "createdBy": "uuid",
  "createdAt": "ISO 8601 timestamp"
}
```

### Time Slot Fields
```javascript
{
  "startTime": "HH:MM:SS",
  "endTime": "HH:MM:SS",
  "startTimeFormatted": "HH:MM",
  "endTimeFormatted": "HH:MM"
}
```

### Validation Rules
- **Email**: Must end with `@vgu.edu.vn`
- **Age**: Must be positive integer
- **Housing Location**: Students only, defaults to `off_campus`
- **Specialty Group**: Medical staff only, defaults to `physical`
- **Shift Schedule**: Time format `HH:MM-HH:MM`, start time must be before end time
- **Appointment Time**: 20-minute slots, Monday-Friday, 9:00 AM - 4:00 PM (excluding 12:00-1:00 PM lunch)
- **Priority Level**: Required for appointments
- **Health Issue Type**: Required for appointments, determines medical staff assignment
- **Mood**: Must be one of the 5 defined values
- **Status Fields**: All status enums are strictly validated

---

## �🔒 Authentication & Authorization

### Required Headers
```javascript
Authorization: "Bearer <jwt_token>"
Content-Type: "application/json" // For POST/PATCH requests
```

### User Roles
- **`student`**: Limited access to own data
- **`medical_staff`**: Access to student data and assignments
- **`admin`**: Full system access

### Error Responses
```javascript
// Authentication Required
401: { error: "Authentication required" }

// Insufficient Privileges  
403: { error: "Access denied" }

// Not Found
404: { error: "Resource not found" }

// Validation Error
400: { error: "Validation error message" }

// Server Error
500: { error: "Internal server error" }
```
---

## �️ Frontend API Integration Guide

### Common Mistakes and How to Fix Them

#### ❌ **Mistake 1: Invalid String Concatenation**
```javascript
// WRONG - This creates NaN
const apiEndpoint = + 'http://localhost:5001/api/appointments';

// CORRECT
const apiEndpoint = 'http://localhost:5001/api/appointments';
// OR with base URL
const API_BASE_URL = 'http://localhost:5001/api';
const apiEndpoint = API_BASE_URL + '/appointments';
```

#### ❌ **Mistake 2: Wrong Port Number**
```javascript
// WRONG - Documentation specifies port 5001
const url = 'http://localhost:5000/api/appointments';

// CORRECT
const url = 'http://localhost:5001/api/appointments';
```

#### ❌ **Mistake 3: Headers Configuration Errors**
```javascript
// WRONG - Multiple issues
header: {  // Should be "headers" (plural)
    'Content-Type': 'application.json',  // Wrong MIME type
    'Auth': 'Bearer ${token}'  // Wrong header name + template literal issue
}

// CORRECT
headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // Use backticks for template literals
}
```

#### ❌ **Mistake 4: Missing Token Management**
```javascript
// WRONG - Hardcoded or missing token
const token = 'some-token';

// CORRECT - Get token from localStorage
const getToken = () => {
    const sessionInfo = localStorage.getItem('session-info');
    if (sessionInfo) {
        try {
            const parsed = JSON.parse(sessionInfo);
            return parsed.token;
        } catch (error) {
            console.warn('Invalid session info');
            return null;
        }
    }
    return null;
};
```

#### ❌ **Mistake 5: No Error Handling**
```javascript
// WRONG - No error handling
const response = await fetch(url);
const data = await response.json();

// CORRECT - Proper error handling
const response = await fetch(url);
if (!response.ok) {
    if (response.status === 401) {
        localStorage.removeItem('session-info');
        window.location.href = '/login';
        return;
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
const data = await response.json();
```

### **Complete Working Examples**

#### **1. Get Appointments (Corrected)**
```javascript
const fetchAppointments = async () => {
    try {
        // Get token from localStorage
        const sessionInfo = localStorage.getItem('session-info');
        if (!sessionInfo) {
            throw new Error('No authentication token found');
        }
        
        const { token } = JSON.parse(sessionInfo);
        
        const response = await fetch('http://localhost:5001/api/appointments', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('session-info');
                window.location.href = '/login';
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Appointments:', data.appointments);
        console.log('User role:', data.userRole);
        console.log('Access level:', data.accessLevel);
        
        return data.appointments;
        
    } catch (error) {
        console.error('Error fetching appointments:', error);
        throw error;
    }
};
```

#### **2. Create Appointment with Time Slot Validation**
```javascript
const createAppointment = async (appointmentData) => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token');

        // First, check available time slots
        const slotsResponse = await fetch(
            `http://localhost:5001/api/appointments/time-slots/${appointmentData.date}`,
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        if (!slotsResponse.ok) {
            throw new Error('Failed to fetch available time slots');
        }

        const slotsData = await slotsResponse.json();
        
        if (slotsData.availableTimeSlots.length === 0) {
            throw new Error('No available time slots for the selected date');
        }

        // Create the appointment
        const response = await fetch('http://localhost:5001/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                symptoms: appointmentData.symptoms,
                priorityLevel: appointmentData.priorityLevel,
                dateScheduled: appointmentData.date,
                timeScheduled: appointmentData.selectedTime
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create appointment');
        }

        const data = await response.json();
        return data.appointment;

    } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
    }
};
```

#### **3. Generic API Call Helper Function**
```javascript
const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    const baseURL = 'http://localhost:5001/api';
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${baseURL}${endpoint}`, config);
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('session-info');
                window.location.href = '/login';
                throw new Error('Authentication required');
            }
            
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        return response;
    } catch (error) {
        console.error(`API call failed: ${endpoint}`, error);
        throw error;
    }
};

// Usage examples:
const getAppointments = async () => {
    const response = await apiCall('/appointments');
    return response.json();
};

const createMoodEntry = async (moodData) => {
    const response = await apiCall('/mood-entries', {
        method: 'POST',
        body: JSON.stringify(moodData)
    });
    return response.json();
};
```

### 🔧 **React Hook Integration Examples**

#### **useAppointments Hook**
```javascript
import { useState, useEffect } from 'react';

const useAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiCall('/appointments');
            const data = await response.json();
            setAppointments(data.appointments || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createAppointment = async (appointmentData) => {
        try {
            const response = await apiCall('/appointments', {
                method: 'POST',
                body: JSON.stringify(appointmentData)
            });
            const data = await response.json();
            await fetchAppointments(); // Refresh list
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    return {
        appointments,
        loading,
        error,
        createAppointment,
        refetch: fetchAppointments
    };
};

// Usage in component:
const AppointmentList = () => {
    const { appointments, loading, error, createAppointment } = useAppointments();

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            {appointments.map(appointment => (
                <div key={appointment.id}>
                    <h3>{appointment.symptoms}</h3>
                    <p>Status: {appointment.status}</p>
                    <p>Date: {appointment.dateScheduled}</p>
                </div>
            ))}
        </div>
    );
};
```

#### **useTimeSlots Hook**
```javascript
const useTimeSlots = (selectedDate) => {
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTimeSlots = async (date) => {
        if (!date) return;
        
        try {
            setLoading(true);
            setError(null);
            const response = await apiCall(`/appointments/time-slots/${date}`);
            const data = await response.json();
            setTimeSlots(data.availableTimeSlots || []);
        } catch (err) {
            setError(err.message);
            setTimeSlots([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedDate) {
            fetchTimeSlots(selectedDate);
        }
    }, [selectedDate]);

    return { timeSlots, loading, error };
};

// Usage in component:
const AppointmentBooking = () => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const { timeSlots, loading } = useTimeSlots(selectedDate);

    return (
        <div>
            <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
            />
            
            {loading ? (
                <p>Loading available times...</p>
            ) : (
                <select 
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                >
                    <option value="">Select time</option>
                    {timeSlots.map(slot => (
                        <option key={slot.start_time} value={slot.start_time}>
                            {slot.startTimeFormatted} - {slot.endTimeFormatted}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
};
```

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

