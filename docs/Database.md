# VGU Care Database Documentation

## Entity-Relationship Diagram (ERD) Overview

Based on our ERD diagram, the following is the detailed rundown of the VGU Care Database structure:

### Database Entities

#### 1. Users (Base Entity)
- **user_id** (UUID, Primary Key)
- **name** (VARCHAR, Not Null)
- **gender** (VARCHAR, Not Null) - CHECK: 'male', 'female', 'other'
- **age** (INT, Not Null)
- **role** (ENUM: 'student', 'medical_staff', 'admin', Not Null)
- **email** (VARCHAR, Unique, Not Null)
- **password_hash** (VARCHAR, Not Null)
- **status** (ENUM: 'active', 'inactive', 'banned', Not Null)
- **points** (INT, Not Null) - Behavioral incentive tracking
- **created_at**, **updated_at** (TIMESTAMP)

#### 2. Students (Role-specific)
- **student_id** (UUID, Primary Key)
- **user_id** (UUID, Foreign Key → Users)
- **intake_year** (INT, Not Null)
- **major** (VARCHAR, Not Null)
- **housing_location** (VARCHAR) - ✨ **NEW**: 'dorm_1', 'dorm_2', 'off_campus'

#### 3. Medical Staff (Role-specific)
- **staff_id** (UUID, Primary Key)
- **user_id** (UUID, Foreign Key → Users)
- **specialty** (VARCHAR, Not Null)
- **shift_schedule** (JSONB) - ✨ **NEW**: Weekly schedule in JSON format

#### 4. Admins (Role-specific)
- **admin_id** (UUID, Primary Key)
- **user_id** (UUID, Foreign Key → Users)

#### 5. Appointments
- **appointment_id** (UUID, Primary Key)
- **user_id** (UUID, Foreign Key → Users)
- **medical_staff_id** (UUID, Foreign Key → Medical Staff)
- **status** (ENUM: 'pending', 'approved', 'rejected', 'scheduled', 'completed', 'cancelled')
- **date_requested** (TIMESTAMP, Not Null)
- **date_scheduled** (TIMESTAMP, Null)
- **time_scheduled** (TIME) - For 20-minute time slots
- **priority_level** (ENUM: 'low', 'medium', 'high', Not Null)
- **symptoms** (TEXT, Not Null)

#### 6. Time Slots
- **slot_id** (UUID, Primary Key)
- **start_time** (TIME, Not Null)
- **end_time** (TIME, Not Null)
- **day_of_week** (INTEGER, 1-5 for Monday-Friday)

#### 7. Temporary Advice
- **advice_id** (UUID, Primary Key)
- **appointment_id** (UUID, Foreign Key → Appointments)
- **message** (TEXT, Not Null)
- **date_sent** (TIMESTAMP, Not Null)
- **created_by_staff_id** (UUID, Foreign Key → Medical Staff)

#### 8. Mood Entries
- **entry_id** (UUID, Primary Key)
- **student_id** (UUID, Foreign Key → Students)
- **mood** (ENUM: 'happy', 'sad', 'neutral', 'anxious', 'stressed')
- **entry_date** (TIMESTAMP, Not Null)
- **notes** (TEXT, Null)

#### 9. Abuse Reports
- **report_id** (UUID, Primary Key)
- **staff_id** (UUID, Foreign Key → Medical Staff)
- **student_id** (UUID, Foreign Key → Students)
- **appointment_id** (UUID, Foreign Key → Appointments)
- **report_date** (TIMESTAMP, Not Null)
- **description** (TEXT, Not Null)
- **status** (ENUM: 'open', 'investigating', 'resolved')
- **report_type** (ENUM: 'system_abuse', 'false_urgency', 'inappropriate_behavior', 'other')

#### 10. Notifications
- **notification_id** (UUID, Primary Key)
- **user_id** (UUID, Foreign Key → Users)
- **appointment_id** (UUID, Foreign Key → Appointments)
- **type** (ENUM: 'appointment_assigned', 'appointment_approved', 'appointment_rejected', etc.)
- **title** (VARCHAR, Not Null)
- **message** (TEXT, Not Null)
- **is_read** (BOOLEAN, Default FALSE)
- **created_at**, **read_at** (TIMESTAMP)

## Recent Schema Updates (June 2025)

### Profile Expansion Features ✨

#### Student Housing Location
```sql
ALTER TABLE students ADD COLUMN housing_location VARCHAR(20) 
CHECK (housing_location IN ('dorm_1', 'dorm_2', 'off_campus')) 
DEFAULT 'off_campus';
```

**Purpose**: Track student residence for appointment scheduling optimization. Dorm medical offices have extended hours (until 10pm) compared to main campus (until 4pm).

**Values**:
- `dorm_1`: Student lives in Dormitory 1
- `dorm_2`: Student lives in Dormitory 2  
- `off_campus`: Student lives off-campus

#### Medical Staff Shift Schedules
```sql
ALTER TABLE medical_staff ADD COLUMN shift_schedule JSONB DEFAULT '{}'::jsonb;
```

**Purpose**: Enable flexible shift scheduling for medical staff to improve appointment auto-assignment.

**Format**:
```json
{
  "monday": ["09:00-17:00"],
  "tuesday": ["09:00-17:00", "18:00-22:00"],
  "wednesday": ["09:00-17:00"],
  "thursday": ["09:00-17:00"], 
  "friday": ["09:00-17:00"]
}
```

**Benefits**:
- Supports multiple shifts per day
- Enables automatic staff assignment based on availability
- Flexible JSON structure for future enhancements

### Time Slot System
20-minute appointment slots from 9:00 AM to 4:00 PM, Monday through Friday:
- 21 slots per day (7 hours × 3 slots per hour)
- Prevents double-booking
- Optimizes scheduling efficiency

## Relationships

### Core Relationships
- **Users** → **Students/Medical Staff/Admins** (1:1, role-based inheritance)
- **Students** → **Appointments** (1:Many, students can have multiple appointments)
- **Medical Staff** → **Appointments** (1:Many, staff can handle multiple appointments)
- **Appointments** → **Temporary Advice** (1:1, optional)
- **Students** → **Mood Entries** (1:Many, mental health tracking)
- **Medical Staff** → **Abuse Reports** (1:Many, staff can file multiple reports)

### Enhanced Relationships (Profile Expansion)
- **Medical Staff Shifts** → **Appointment Auto-Assignment** (Shift schedule influences assignment)
- **Student Housing** → **Appointment Scheduling** (Housing affects available time slots)

## Indexes for Performance

```sql
-- Appointment queries
CREATE INDEX idx_appointments_date_time ON appointments(date_scheduled, time_scheduled);
CREATE INDEX idx_appointments_user_status ON appointments(user_id, status);
CREATE INDEX idx_appointments_staff_status ON appointments(medical_staff_id, status);

-- Time slot queries  
CREATE INDEX idx_time_slots_day_time ON time_slots(day_of_week, start_time);

-- Notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- User lookup queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_status ON users(role, status);
```

## Data Migration Scripts

### Schema Update Script
```bash
node database/update-profile-schema.js
```

### Password Hash Update
```bash  
node database/update-hashes.js
```

### Database Reset (Development)
```powershell
.\reset-database.ps1
```

## Sample Data

The database includes sample data for testing:
- 7 Students with various majors and housing locations
- 2 Medical Staff with different specialties and shift schedules  
- 1 Admin user
- Sample appointments, mood entries, and notifications

## Security Considerations

- **Password Hashing**: bcrypt with salt rounds = 12
- **UUID Usage**: All primary keys use UUIDs for security
- **Role-based Access**: Database constraints enforce role boundaries
- **Data Validation**: CHECK constraints prevent invalid data
- **Audit Trail**: Timestamps track creation and updates

## Database Connection

- **Engine**: PostgreSQL 17 Alpine
- **Host**: localhost:5433 (Docker)
- **Database**: vgu_care
- **User**: vgu_user
- **Connection**: Environment variable DATABASE_URL
