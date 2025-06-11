# Role-Based Privilege System
As we have implemented a role-based system during user login, we now need to implement privilege systems for each role.

## User Privileges

### Student:
- View/Update own profile
- View/create/update own appointments
- View/create/update own mood tracker entries
- Upload/edit/download/delete own medical documents
- View temporary advice

### Medical Staff:
- View/update own profile
- View all student profiles
- View/create/update appointments of students who booked with them
- View student's mood tracker entries
- View student's medical documents
  - Can also upload/edit/delete medical documents but only related to their appointments, such as prescriptions.
- Create/update/delete temporary advice
- View/create/update/delete system abuse reports

### Admin: (DONE)
- View all student profiles
- View all medical staff profiles
- View/create/update appointments for all students
- View/create/update mood tracker entries for all students
- View/create/update/delete medical documents for all students
- Create/update/delete temporary advice for all students
- View/create/update/delete system abuse reports for all users
- Manage user roles and permissions

---

# Implementation Tasks (Priority Order)

## 1. Enhanced Role-Based Middleware (HIGH PRIORITY)
- [X] Create `roleMiddleware.js` with granular role checking functions
  - [X] `requireRole(...allowedRoles)` - Check for specific roles
  - [X] `requireMedicalStaffOrAdmin` - Medical staff or admin access
  - [X] `requireStudentOwnership` - Students can only access their own data
  - [X] `requireAppointmentAccess` - Role-based appointment access control
- [X] Replace existing basic `adminAuth` with granular middleware
- [X] If possible, check `auth.js` for existing role checks and update to use new middleware

## 2. Missing Core Entities & Controllers (HIGH PRIORITY)

### Medical Documents System
- [ ] Create `MedicalDocument.js` model with fields:
  - [ ] studentId, uploadedById, appointmentId (optional)
  - [ ] filename, originalName, fileType, fileSize, filePath
  - [ ] documentType enum (prescription, lab_result, medical_report, other)
  - [ ] **Use file system storage for development, cloud storage for production**
- [ ] Create `medicalDocumentController.js` with role-based access:
  - [ ] Students: CRUD own documents
  - [ ] Medical Staff: View student docs + upload appointment-related docs
  - [ ] Admin: Full CRUD access
- [ ] Create `documentRoutes.js` with protected endpoints
- [ ] **Set up multer for local file uploads during development**
- [ ] **Plan cloud storage migration for production (AWS S3/Google Cloud)**

### Temporary Advice System
- [ ] Create `TemporaryAdvice.js` model with fields:
  - [ ] title, content, category enum, createdById
  - [ ] isActive, priority enum (low, medium, high)
- [ ] Create `temporaryAdviceController.js` with role-based access:
  - [ ] Students: View only
  - [ ] Medical Staff: Full CRUD
  - [ ] Admin: Full CRUD
- [ ] Create `adviceRoutes.js` with protected endpoints

### System Abuse Report System
- [ ] Create `AbuseReport.js` model with fields:
  - [ ] reporterId, reportedUserId, reportType enum
  - [ ] description, status enum, handledById
- [ ] Create `abuseReportController.js` with role-based access:
  - [ ] Students: Cannot access (reports handled through other channels)
  - [ ] Medical Staff: Full CRUD
  - [ ] Admin: Full CRUD + user management actions
- [ ] Create `reportRoutes.js` with protected endpoints

## 3. Enhanced Route Protection (MEDIUM PRIORITY)
- [ ] Update existing `userRoutes.js` with role-based access:
  - [ ] Profile access: Students own only, Medical Staff + Admin any
  - [ ] Student list: Medical Staff + Admin only
- [ ] Update existing `appointmentRoutes.js` with role-based access:
  - [ ] Students: Own appointments only
  - [ ] Medical Staff: Appointments where they are assigned
  - [ ] Admin: All appointments
- [ ] Update existing `moodRoutes.js` with role-based access:
  - [ ] Students: Own mood entries only
  - [ ] Medical Staff: View student mood entries
  - [ ] Admin: All mood entries

## 4. File Upload & Management System (MEDIUM PRIORITY)
- [ ] Set up `multer` middleware for file uploads
- [ ] Create secure file storage structure (`uploads/medical-documents/`)
- [ ] Implement file type validation (PDF, JPEG, PNG)
- [ ] Add file size limits (10MB max)
- [ ] Create file download/deletion endpoints with role-based access
- [ ] Implement file cleanup for deleted records

## 5. Database Associations Setup (MEDIUM PRIORITY)
- [ ] Update `associations.js` with new model relationships:
  - [ ] User ↔ MedicalDocument associations
  - [ ] User ↔ TemporaryAdvice associations  
  - [ ] User ↔ AbuseReport associations
  - [ ] Appointment ↔ MedicalDocument associations
- [ ] Update database migrations for new tables
- [ ] Add foreign key constraints and indexes

## 6. API Documentation & Testing (LOW PRIORITY)
- [ ] Document new API endpoints in `Backend_logs.md`
- [ ] Create Postman collection for role-based testing
- [ ] Add unit tests for role-based middleware
- [ ] Add integration tests for new controllers

## 7. Security Enhancements (LOW PRIORITY)
- [ ] Add rate limiting for file uploads
- [ ] Implement audit logging for sensitive operations
- [ ] Add data validation for all new endpoints
- [ ] Implement soft delete for sensitive records (abuse reports, medical docs)

---

# Notes
- All new routes must use appropriate role-based middleware
- File uploads require virus scanning in production
- Medical documents need encryption at rest for HIPAA compliance
- Abuse reports should trigger email notifications to admins