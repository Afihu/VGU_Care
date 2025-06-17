# Role-Based Privilege System
As we have implemented a role-based system during user login, we now need to implement privilege systems for each role.

## User Privileges

### Student: (Done)
- View/Update own profile
- View/create/update own appointments
- View/create/update own mood tracker entries
- View temporary advice

### Medical Staff: (Done)
- View/update own profile
- View all student profiles
- View/create/update appointments of students who booked with them
- View student's mood tracker entries
- Create/update/delete temporary advice
- View/create/update/delete system abuse reports

### Admin: (DONE)
- View all student profiles
- View all medical staff profiles
- View/create/update appointments for all students
- View/create/update mood tracker entries for all students
- Create/update/delete temporary advice for all students
- View/create/update/delete system abuse reports for all users
- Manage user roles and permissions

---

# Implementation Tasks (Priority Order)

## 1. Enhanced Role-Based Middleware - ✅ COMPLETED

## 2. Core Systems Implementation - ✅ COMPLETED
- ✅ **Temporary Advice System** - Full CRUD functionality
- ✅ **System Abuse Report System** - Complete reporting and resolution
- ✅ **Mood Tracker System** - Student tracking and admin management
- ✅ **Medical Staff System** - Profile management and student data access
- ✅ **Auto-Assignment Feature** - New appointments auto-assigned to least busy medical staff

## 3. Enhanced Route Protection - ✅ COMPLETED

## 4. NEW PRIORITY ITEMS (Current Focus):
- [ ] **Code refactoring** - eliminate duplicate code in routes, services, and controllers
- [ ] **Notification system implementation**
  - [ ] Medical staff notifications for new appointments
  - [ ] Student notifications for appointment status changes

## 5. Database Associations Setup (MEDIUM PRIORITY)
- [ ] Update `associations.js` with remaining model relationships
- [ ] Update database migrations for any missing tables
- [ ] Add foreign key constraints and indexes

## 6. API Documentation & Testing (LOW PRIORITY) - Concurrent with development
- [ ] Document new API endpoints in `Backend_logs.md`
- [ ] Create Postman collection for role-based testing
- [ ] Add unit tests for role-based middleware
- [ ] Add integration tests for controllers

## 7. Security Enhancements (LOW PRIORITY) - Consider during migration to remote server hosting
- [ ] Add rate limiting for API endpoints
- [ ] Implement audit logging for sensitive operations
- [ ] Add enhanced data validation for all endpoints
- [ ] Implement soft delete for sensitive records (abuse reports)

---

# Notes
- All routes use appropriate role-based middleware
- Medical documents will be handled in-person during appointments
- Students advised to bring physical documents to appointments
- Abuse reports should trigger email notifications to admins (future enhancement)