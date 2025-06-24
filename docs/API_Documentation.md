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
- **Response**: `{ message, user: { email, role, status }, token }`
- **Status**: ✅ **Implemented & Tested**

### Signup
- **POST** `/api/signup`
- **Body**: 
  ```json
  {
    "email": "string (@vgu.edu.vn domain required)",
    "password": "string",
    "name": "string", 
    "gender": "male|female|other",
    "age": "number",
    "role": "student|medical_staff|admin",
    "roleSpecificData": {
      // For Students:
      "intakeYear": "number (optional, defaults to current year)",
      "major": "string (optional, defaults to 'Undeclared')", 
      "housingLocation": "dorm_1|dorm_2|off_campus (optional, defaults to 'off_campus')"
      
      // For Medical Staff:
      "specialty": "string (optional, defaults to 'General Medicine')",
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
- **Validation**:
  - Email must be from @vgu.edu.vn domain
  - All fields (email, password, name, gender, age, role) are required
  - Role must be one of: student, medical_staff, admin
  - Housing location must be valid enum if provided
  - Prevents duplicate email registration
- **Error Responses**:
  - `400`: Missing required fields, invalid email domain, invalid role, or user already exists
  - `500`: Server error during account creation
- **Status**: ✅ **Implemented & Tested**

---

## 👤 User Profile APIs

### Get Current User Profile
- **GET** `/api/users/me`
- **Auth**: Bearer Token (All Roles)
- **Response**: `{ user: { email, role, name, age, ... } }`
- **Status**: ✅ **Implemented & Tested**
- **Enhanced**: Now includes role-specific fields:
  - **Students**: `intakeYear`, `major`, `housingLocation` (`dorm_1`, `dorm_2`, `off_campus`)
  - **Medical Staff**: `specialty`, `shiftSchedule` (JSONB with weekly schedule)

### Update Profile
- **PATCH** `/api/users/profile`
- **Auth**: Bearer Token
- **Body**: 
  ```json
  {
    "name": "string (optional)",
    "gender": "male|female|other (optional)",
    "age": "number (optional)",
    "roleSpecificData": {
      // For Students:
      "intakeYear": "number (optional)",
      "major": "string (optional)",
      "housingLocation": "dorm_1|dorm_2|off_campus (optional)"
      
      // For Medical Staff:
      "specialty": "string (optional)",
      "shiftSchedule": {
        "monday": ["09:00-17:00"],
        "tuesday": ["09:00-17:00", "18:00-22:00"],
        // ... other days
      }
    }
  }
  ```
- **Response**: `{ message: "Profile updated successfully", user: {...} }`
- **Status**: ✅ **Implemented & Tested** *(Updated June 23, 2025)*
- **Validation**: 
  - Housing location must be valid enum value
  - Shift schedule must follow HH:MM-HH:MM format
  - Start time must be before end time
  - Proper error handling with 400 status for validation errors

### Change Password
- **PATCH** `/api/users/change-password`
- **Auth**: Bearer Token
- **Body**: `{ currentPassword, newPassword }`
- **Status**: ✅ **Implemented**

### Get User Profile by ID
- **GET** `/api/users/profile/:userId`
- **Auth**: Bearer Token (Role-based access)
- **Status**: ✅ **Implemented**

### Get All Students
- **GET** `/api/users/students`
- **Auth**: Bearer Token (Medical Staff + Admin only)
- **Status**: ✅ **Implemented**

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
      "status": "pending",
      "dateRequested": "2025-06-19T10:30:00Z",
      "dateScheduled": "2025-06-20T00:00:00Z",
      "timeScheduled": "09:00:00",
      "priorityLevel": "medium",
      "symptoms": "Headache and fever",
      "hasAdvice": false
    }
  ],
  "userRole": "student",
  "accessLevel": "filtered"
}
```
**Auth**: Bearer Token (All Roles)  
**Access**: 
- Students: Own appointments only
- Medical Staff: Assigned and pending appointments  
- Admin: All appointments  
**Status**: ✅ **Implemented & Tested**

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
**Status**: ✅ **Implemented & Tested**

### Create Appointment
**POST** `/api/appointments`
```javascript
// Request Body:
{
  "symptoms": "Headache and fever",
  "priorityLevel": "medium",           // "low" | "medium" | "high"
  "dateScheduled": "2025-06-20",       // Optional: specific date
  "timeScheduled": "09:00:00"          // Optional: specific time (requires dateScheduled)
}

// Example Response:
{
  "message": "Appointment created successfully",
  "appointment": {
    "id": "uuid",
    "userId": "uuid",
    "status": "pending", 
    "dateRequested": "2025-06-19T10:30:00Z",
    "dateScheduled": "2025-06-20T00:00:00Z",
    "timeScheduled": "09:00:00",
    "priorityLevel": "medium",
    "symptoms": "Headache and fever"
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
**Status**: ✅ **Implemented & Tested**

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
  "status": "pending",
  "dateRequested": "2025-06-19T10:30:00Z", 
  "dateScheduled": "2025-06-20T00:00:00Z",
  "timeScheduled": "09:00:00",
  "priorityLevel": "medium",
  "symptoms": "Headache and fever"
}
```
**Auth**: Bearer Token (Ownership/Assignment required)  
**Status**: ✅ **Implemented & Tested**

### Update Appointment
**PATCH** `/api/appointments/:appointmentId`
```javascript
// Request Body:
{
  "symptoms": "Updated symptoms",      // Optional
  "status": "approved",               // Optional: "pending" | "approved" | "rejected" | "completed" | "cancelled"
  "priorityLevel": "high",            // Optional: "low" | "medium" | "high"
  "dateScheduled": "2025-06-21",      // Optional: new date (reschedule)
  "timeScheduled": "10:00:00"         // Optional: new time (reschedule - validates availability)
}

// Example Response:
{
  "id": "uuid",
  "userId": "uuid", 
  "status": "approved",
  "dateRequested": "2025-06-19T10:30:00Z",
  "dateScheduled": "2025-06-21T00:00:00Z",
  "timeScheduled": "10:00:00",
  "priorityLevel": "high",
  "symptoms": "Updated symptoms"
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
**Status**: ✅ **Implemented & Tested**

### Delete Appointment
**DELETE** `/api/appointments/:appointmentId`
```javascript
// Example Response:
{
  "message": "Appointment deleted successfully"
}
```
**Auth**: Bearer Token (Ownership/Assignment required)  
**Status**: ✅ **Implemented**

---

## 🏥 Medical Staff APIs

### Get Medical Staff Profile
- **GET** `/api/medical-staff/profile`
- **Auth**: Bearer Token (Medical Staff only)
- **Response**: `{ success: true, user: { name, email, role, specialty, shiftSchedule, ... } }`
- **Status**: ✅ **Implemented & Tested**

### Update Medical Staff Profile
- **PATCH** `/api/medical-staff/profile`
- **Auth**: Bearer Token (Medical Staff only)
- **Body**: `{ name?, specialty?, age?, gender?, shiftSchedule? }`
- **Response**: `{ success: true, user: { ... } }`
- **Status**: ✅ **Implemented & Tested**

### Get All Student Profiles
- **GET** `/api/medical-staff/students`
- **Auth**: Bearer Token (Medical Staff only)
- **Response**: `{ success: true, students: [...], count: number }`
- **Status**: ✅ **Implemented & Tested**

### Get Specific Student Profile
- **GET** `/api/medical-staff/students/:studentId`
- **Auth**: Bearer Token (Medical Staff only)
- **Response**: `{ success: true, student: { ... } }`
- **Status**: ✅ **Implemented & Tested**

---

## 🔧 Infrastructure APIs

### Health Check
- **GET** `/api/health`
- **Auth**: None
- **Response**: `{ message, timestamp }`
- **Status**: ✅ **Implemented & Tested**

### Database Test
- **GET** `/api/test-db`
- **Auth**: None
- **Response**: `{ message }`
- **Status**: ✅ **Implemented & Tested**

---

## 👨‍💼 Admin APIs

### User Management
- **GET** `/api/admin/users/students` - Get all student profiles
- **GET** `/api/admin/users/medical-staff` - Get all medical staff profiles
- **PATCH** `/api/admin/users/:userId/role` - Update user role
- **PATCH** `/api/admin/users/:userId/status` - Update user status
- **Auth**: Bearer Token (Admin only)
- **Status**: ✅ **Fully Implemented & Tested**

### Appointment Management
- **GET** `/api/admin/appointments` - Get all appointments
- **POST** `/api/admin/appointments/users/:userId` - Create appointment for user
- **PATCH** `/api/admin/appointments/:appointmentId` - Update any appointment
- **Auth**: Bearer Token (Admin only)
- **Status**: ✅ **Fully Implemented & Tested**

### Mood Tracker Management
- **GET** `/api/admin/mood-entries` - Get all mood entries
- **POST** `/api/admin/mood-entries/users/:userId` - Create mood entry for user
- **PATCH** `/api/admin/mood-entries/:entryId` - Update mood entry
- **Auth**: Bearer Token (Admin only)
- **Status**: ✅ **Fully Implemented & Tested**

### Temporary Advice Management
- **GET** `/api/admin/temporary-advice` - Get all advice
- **POST** `/api/admin/temporary-advice/appointments/:appointmentId` - Create advice
- **PATCH** `/api/admin/temporary-advice/:adviceId` - Update advice
- **DELETE** `/api/admin/temporary-advice/:adviceId` - Delete advice
- **Auth**: Bearer Token (Admin only)
- **Status**: ✅ **Fully Implemented & Tested**

### Abuse Reports Management
- **GET** `/api/admin/abuse-reports` - Get all reports
- **POST** `/api/admin/abuse-reports` - Create abuse report
- **PATCH** `/api/admin/abuse-reports/:reportId` - Update report
- **DELETE** `/api/admin/abuse-reports/:reportId` - Delete report
- **Auth**: Bearer Token (Admin only)
- **Status**: ✅ **Fully Implemented & Tested**

---

## 📋 Mood Tracker APIs

### Mood Entry Management
**POST** `/api/mood-entries`
```javascript
// Request Body:
{
  "mood": "happy",        // Required: "happy" | "sad" | "neutral" | "anxious" | "stressed"
  "notes": "Feeling good today!"  // Optional: Additional notes
}

// Example Response:
{
  "moodEntry": {
    "id": "uuid",
    "userId": "uuid",
    "mood": "happy",
    "notes": "Feeling good today!",
    "entry_date": "2025-06-23T10:30:00Z"
  }
}
```
- **Auth**: Bearer Token (Student role only)
- **Response**: Created mood entry object
- **Status**: ✅ **Fully Implemented & Tested**

**GET** `/api/mood-entries`
```javascript
// Example Response:
{
  "moodEntries": [
    {
      "id": "uuid",
      "userId": "uuid",
      "mood": "happy",
      "notes": "Feeling good today!",
      "entry_date": "2025-06-23T10:30:00Z"
    }
  ]
}
```
- **Auth**: Bearer Token (Student role only)
- **Response**: Object containing `moodEntries` array with own mood entries
- **Status**: ✅ **Fully Implemented & Tested**

**PATCH** `/api/mood-entries/:entryId` or **PUT** `/api/mood-entries/:entryId`
```javascript
// Request Body:
{
  "mood": "stressed",     // Optional: Updated mood value
  "notes": "Updated notes"  // Optional: Updated notes
}

// Example Response:
{
  "moodEntry": {
    "id": "uuid",
    "userId": "uuid",
    "mood": "stressed",
    "notes": "Updated notes",
    "entry_date": "2025-06-23T10:30:00Z"
  }
}
```
- **Auth**: Bearer Token (Student role only, ownership required)
- **Response**: Updated mood entry object
- **Status**: ✅ **Fully Implemented & Tested**

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
- **Status**: ✅ **Fully Implemented & Tested**

**GET** `/api/mood-entries/student/:studentUserId`
```javascript
// Example Response:
{
  "moodEntries": [
    {
      "id": "uuid",
      "userId": "uuid",
      "mood": "happy",
      "notes": "Feeling good today!",
      "entry_date": "2025-06-23T10:30:00Z"
    }
  ]
}
```
- **Auth**: Bearer Token (Medical Staff only)
- **Access**: Medical staff can only view mood entries for students they have appointments with
- **Response**: Object containing `moodEntries` array for specified student
- **Status**: ✅ **Fully Implemented & Tested**

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
      "type": "appointment_update",
      "title": "Appointment Scheduled",
      "message": "Your appointment has been scheduled for June 20, 2025",
      "isRead": false,
      "createdAt": "2025-06-19T10:30:00Z"
    }
  ]
}
```
- **Auth**: Bearer Token (All roles)
- **Access**: User-specific notifications only
- **Status**: ✅ **Fully Implemented & Tested**

### Get Unread Count
**GET** `/api/notifications/count`
```javascript
// Example Response:
{
  "unreadCount": 3
}
```
- **Auth**: Bearer Token (All roles)
- **Status**: ✅ **Fully Implemented & Tested**

### Mark Notification as Read
**PATCH** `/api/notifications/:notificationId/read`
```javascript
// Example Response:
{
  "message": "Notification marked as read",
  "notification": { ... }
}
```
- **Auth**: Bearer Token (Ownership required)
- **Status**: ✅ **Fully Implemented & Tested**

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
- **Status**: ✅ **Fully Implemented & Tested**

### Delete Notification
**DELETE** `/api/notifications/:notificationId`
```javascript
// Example Response:
{
  "message": "Notification deleted successfully"
}
```
- **Auth**: Bearer Token (Ownership required)
- **Status**: ✅ **Fully Implemented & Tested**

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
- **Status**: ✅ **Fully Implemented & Tested**

### Temporary Advice
- **GET** `/api/advice` - Get advice (All roles can view)
- **POST** `/api/advice` - Create advice (Medical Staff + Admin)
- **GET** `/api/advice/:adviceId` - Get specific advice
- **PATCH** `/api/advice/:adviceId` - Update advice (Medical Staff + Admin)
- **DELETE** `/api/advice/:adviceId` - Delete advice (Medical Staff + Admin)
- **Auth**: Bearer Token (Role-based access)
- **Status**: ✅ **Fully Implemented & Tested**

---

## 🔒 Authentication & Authorization

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

## 📊 Implementation Status

### ✅ Fully Implemented & Tested
- **Authentication System** (Login/Signup with JWT)
- **Enhanced User Profile Management** (with housing location & shift schedules)
- **Advanced Appointment Management** (Role-based with auto-assignment & time slot booking)
- **Medical Staff System** (Complete profile & student access management)
- **Mood Tracker System** (`/mood-entries` endpoints for comprehensive mood tracking)
- **Notification System** (Real-time notifications with read/unread status)
- **Temporary Advice System** (Medical staff can provide advice)
- **Abuse Reports System** (Reporting and management)
- **Comprehensive Admin Management** (Complete CRUD for all resources)
- **Infrastructure APIs** (Health checks and database tests)

### 🎯 Frontend Integration Ready
All core APIs are ready for frontend integration with:
- Comprehensive error handling patterns
- Role-based access control
- JWT authentication flow
- Real-time notification support
- Profile expansion features (housing location, shift schedules)
- Advanced appointment booking with time slot management

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

### 🧪 Testing Coverage
- **100% Core API Test Coverage**: All implemented endpoints have comprehensive tests
- **Role-Based Access Testing**: All permission scenarios covered
- **Integration Testing**: Full workflow testing for appointments, profiles, mood tracking
- **Error Scenario Testing**: All error cases and edge cases tested
- **Database Integration Testing**: Schema and data integrity verified

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

### ✅ **Complete Working Examples**

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

