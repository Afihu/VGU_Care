-- VGU Care Database Schema - Complete Implementation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (base entity)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
    age INT NOT NULL CHECK (age > 0),
    role VARCHAR(20) CHECK (role IN ('student', 'medical_staff', 'admin')) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'banned')) NOT NULL DEFAULT 'active',
    points INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    intake_year INT NOT NULL,
    major VARCHAR(100) NOT NULL,    
    housing_location VARCHAR(20) CHECK (housing_location IN ('dorm_1', 'dorm_2', 'off_campus')) DEFAULT 'off_campus'
);

-- Schedules table for managing shift schedules
CREATE TABLE schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'morning', 'afternoon', 'full-day', etc.
    description VARCHAR(255),
    schedule_data JSONB NOT NULL, -- {"monday": ["09:00-12:00"], "tuesday": ["09:00-12:00"], ...}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical Staff table
CREATE TABLE medical_staff (
    staff_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL,
    specialty_group VARCHAR(10) CHECK (specialty_group IN ('physical', 'mental')) NOT NULL DEFAULT 'physical',
    schedule_id UUID REFERENCES schedules(schedule_id) ON DELETE SET NULL
);

-- Admin table
CREATE TABLE admins (
    admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE
);

-- Appointments table
CREATE TABLE appointments (
    appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    medical_staff_id UUID REFERENCES medical_staff(staff_id) ON DELETE SET NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')) NOT NULL DEFAULT 'pending',
    date_requested TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_scheduled TIMESTAMP NOT NULL,
    time_scheduled TIME NOT NULL,
    priority_level VARCHAR(10) CHECK (priority_level IN ('low', 'medium', 'high')) NOT NULL,
    symptoms TEXT NOT NULL,
    health_issue_type VARCHAR(10) CHECK (health_issue_type IN ('physical', 'mental')) NOT NULL
);

-- Temporary Advice table
CREATE TABLE temporary_advice (
    advice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    date_sent TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);



-- Mood Entry table
CREATE TABLE mood_entries (
    entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    mood VARCHAR(20) CHECK (mood IN ('happy', 'sad', 'neutral', 'anxious', 'stressed')) NOT NULL,
    entry_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL
);

-- Abuse Reports table
CREATE TABLE abuse_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES medical_staff(staff_id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(student_id) ON DELETE SET NULL,
    report_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('open', 'investigating', 'resolved')) NOT NULL DEFAULT 'open',
    appointment_id UUID REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    report_type VARCHAR(50) DEFAULT 'system_abuse' CHECK (report_type IN ('system_abuse', 'false_urgency', 'inappropriate_behavior', 'other'))
);



-- Notifications table for in-app notification system
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('appointment_assigned', 'appointment_approved', 'appointment_rejected', 'appointment_completed', 'general')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Blackout dates table for holiday management
CREATE TABLE blackout_dates (
    blackout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    reason VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'holiday' CHECK (type IN ('holiday', 'maintenance', 'staff_training', 'emergency')),
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_blackout_dates_date ON blackout_dates(date);

-- Dummy Data (10 users: 7 students, 2 medical staff, 1 admin)

-- Insert Users
INSERT INTO users (name, gender, age, role, email, password_hash, status, points) VALUES
-- Students (7)
('Nguyen Van A', 'male', 20, 'student', 'student1@vgu.edu.vn', '$2b$12$NVIBRd1VdyKN2e/eV4uMqefPYtSAlKci343BU18GaWj6Rj7jTCpe6', 'active', 150),
('Tran Thi B', 'female', 21, 'student', 'student2@vgu.edu.vn', '$2b$12$bFpQZVl7aTYz3zhtS4c0XOVgpLLtUpJeQlTU5zWGfgbHDjeEjuru2', 'active', 200),
('Le Van C', 'male', 19, 'student', 'student3@vgu.edu.vn', '$2b$12$Z5gK28IK2biizpQxrvZb2.3pLshpqTncmUlPADq/YY/rzZiNBYZkS', 'active', 75),
('Pham Thi D', 'female', 22, 'student', 'student4@vgu.edu.vn', '$2b$12$Sc5DQfh7YloypZ5eir.bJe3uGwFmRWRG0L8eT/RSlCS4/FTmC9t.y', 'active', 300),
('Hoang Van E', 'male', 20, 'student', 'student5@vgu.edu.vn', '$2b$12$Jsvo.9VqVbffjKVskQSXD.6j5R0QPlycRwnPHrs3.MPMpa2VXCg4i', 'active', 125),
('Vu Thi F', 'female', 21, 'student', 'student6@vgu.edu.vn', '$2b$12$4qlS/tiEd64CxhGemRYMT.t5weGwKti.EcYLwemIsWEghYIWEpWFC', 'inactive', 50),
('Do Van G', 'male', 23, 'student', 'student7@vgu.edu.vn', '$2b$12$dFyTJomnzcrasdQjdh6btOiYlKORm46M.ewxa36E/9N7ehDUD278K', 'active', 175),

-- Medical Staff (2)
('Dr. Nguyen Thi H', 'female', 35, 'medical_staff', 'doctor1@vgu.edu.vn', '$2b$12$0lRBaz/nebDejhzF/gWxiOfu258rjxK2gGpDhDRmxlpRTgaUDy4ja', 'active', 0),
('Dr. Tran Van I', 'male', 42, 'medical_staff', 'doctor2@vgu.edu.vn', '$2b$12$7s4qUDBo2tK/q.eDGMz8Bea6gNtT59g9HDJX1hsCd1OBrUIi9rEn2', 'active', 0),

-- Admin (1)
('Admin User', 'other', 30, 'admin', 'admin@vgu.edu.vn', '$2b$12$BL51RqLPDeyQa0ekO31HwegbWltt1/NeomeoHHoVqBdkoVLXyIhey', 'active', 0);

-- Insert Students (get user_ids for students)
INSERT INTO students (user_id, intake_year, major, housing_location)
SELECT u.user_id, 
       CASE 
           WHEN u.email = 'student1@vgu.edu.vn' THEN 2023
           WHEN u.email = 'student2@vgu.edu.vn' THEN 2022
           WHEN u.email = 'student3@vgu.edu.vn' THEN 2024
           WHEN u.email = 'student4@vgu.edu.vn' THEN 2021
           WHEN u.email = 'student5@vgu.edu.vn' THEN 2023
           WHEN u.email = 'student6@vgu.edu.vn' THEN 2022
           WHEN u.email = 'student7@vgu.edu.vn' THEN 2020
       END as intake_year,
       CASE 
           WHEN u.email = 'student1@vgu.edu.vn' THEN 'CSE'
           WHEN u.email = 'student2@vgu.edu.vn' THEN 'BBA'
           WHEN u.email = 'student3@vgu.edu.vn' THEN 'ECE'
           WHEN u.email = 'student4@vgu.edu.vn' THEN 'MEN'
           WHEN u.email = 'student5@vgu.edu.vn' THEN 'ARC'
           WHEN u.email = 'student6@vgu.edu.vn' THEN 'BFA'
           WHEN u.email = 'student7@vgu.edu.vn' THEN 'BCE'
       END as major,
       CASE 
           WHEN u.email = 'student1@vgu.edu.vn' THEN 'dorm_1'
           WHEN u.email = 'student2@vgu.edu.vn' THEN 'dorm_2'
           WHEN u.email = 'student3@vgu.edu.vn' THEN 'dorm_1'
           WHEN u.email = 'student4@vgu.edu.vn' THEN 'off_campus'
           WHEN u.email = 'student5@vgu.edu.vn' THEN 'dorm_2'
           WHEN u.email = 'student6@vgu.edu.vn' THEN 'off_campus'
           WHEN u.email = 'student7@vgu.edu.vn' THEN 'dorm_1'
       END as housing_location
FROM users u WHERE u.role = 'student';

-- Add new fields before inserting data
-- Add shift_schedule to medical_staff table
ALTER TABLE medical_staff ADD COLUMN IF NOT EXISTS shift_schedule JSONB DEFAULT '{}'::jsonb;

-- Add specialty_group to medical_staff table for physical/mental categorization  
ALTER TABLE medical_staff ADD COLUMN IF NOT EXISTS specialty_group VARCHAR(10) CHECK (specialty_group IN ('physical', 'mental')) DEFAULT 'physical';

-- Insert Medical Staff
INSERT INTO medical_staff (user_id, specialty, specialty_group, shift_schedule)
SELECT u.user_id,
       CASE 
           WHEN u.email = 'doctor1@vgu.edu.vn' THEN 'General Medicine'
           WHEN u.email = 'doctor2@vgu.edu.vn' THEN 'Psychology'
       END as specialty,
       CASE 
           WHEN u.email = 'doctor1@vgu.edu.vn' THEN 'physical'
           WHEN u.email = 'doctor2@vgu.edu.vn' THEN 'mental'
       END as specialty_group,       CASE 
           WHEN u.email = 'doctor1@vgu.edu.vn' THEN '{"monday": ["09:00-16:00"], "tuesday": ["09:00-16:00"], "wednesday": ["09:00-16:00"], "thursday": ["09:00-16:00"], "friday": ["09:00-16:00"]}'::jsonb
           WHEN u.email = 'doctor2@vgu.edu.vn' THEN '{"monday": ["09:00-16:00"], "tuesday": ["09:00-16:00"], "wednesday": ["09:00-16:00"], "thursday": ["09:00-16:00"], "friday": ["09:00-16:00"]}'::jsonb
       END as shift_schedule
FROM users u WHERE u.role = 'medical_staff';

-- Insert Admin
INSERT INTO admins (user_id)
SELECT user_id FROM users WHERE role = 'admin';

-- Sample appointments with proper time scheduling
INSERT INTO appointments (user_id, priority_level, symptoms, health_issue_type, date_scheduled, time_scheduled, medical_staff_id)
SELECT 
  s.user_id, 
  'medium', 
  'Headache and fever', 
  'physical', 
  CURRENT_TIMESTAMP + INTERVAL '2 days',
  '10:00:00',
  (SELECT staff_id FROM medical_staff WHERE specialty_group = 'physical' LIMIT 1)
FROM students s LIMIT 3;

-- Sample mood entries
INSERT INTO mood_entries (student_id, mood, notes)
SELECT s.student_id, 'happy', 'Feeling great today!'
FROM students s LIMIT 2;

INSERT INTO mood_entries (student_id, mood, notes)
SELECT s.student_id, 'happy', 'Test mood entry from schema.sql'
FROM students s
JOIN users u ON s.user_id = u.user_id
WHERE u.email = 'student1@vgu.edu.vn';

-- Update the appointments table status to include approval workflow
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled'));

-- Set default to 'pending' instead of 'scheduled'
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'pending';

-- Add created_by_staff_id to temporary_advice for medical staff tracking
ALTER TABLE temporary_advice ADD COLUMN created_by_staff_id UUID REFERENCES medical_staff(staff_id) ON DELETE CASCADE;

-- Add these columns to the existing abuse_reports table
ALTER TABLE abuse_reports ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(appointment_id) ON DELETE SET NULL;
ALTER TABLE abuse_reports ADD COLUMN IF NOT EXISTS report_type VARCHAR(50) DEFAULT 'system_abuse' CHECK (report_type IN ('system_abuse', 'false_urgency', 'inappropriate_behavior', 'other'));

-- Add time_scheduled column to appointments table for time slot functionality
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS time_scheduled TIME;

-- Create time_slots table to manage available appointment slots
CREATE TABLE IF NOT EXISTS time_slots (
    slot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 5), -- 1=Monday, 5=Friday
    UNIQUE(start_time, day_of_week)
);

-- Populate time_slots with 20-minute slots from 9am to 4pm EXCLUDING lunch (12pm-1pm)
-- Morning slots: 9:00-12:00 (9 slots) + Afternoon slots: 13:00-16:00 (9 slots) = 18 slots per day
INSERT INTO time_slots (start_time, end_time, day_of_week)
SELECT 
    start_time,
    (start_time + interval '20 minutes') as end_time,
    day_num
FROM (
    -- Morning slots: 9:00 AM to 12:00 PM (9 slots)
    SELECT 
        (TIME '09:00:00' + (interval '20 minutes' * slot_number)) as start_time,
        day_num
    FROM 
        generate_series(0, 8) as slot_number, -- 9 morning slots
        generate_series(1, 5) as day_num -- Monday to Friday
    
    UNION ALL
    
    -- Afternoon slots: 1:00 PM to 4:00 PM (9 slots)  
    SELECT 
        (TIME '13:00:00' + (interval '20 minutes' * slot_number)) as start_time,
        day_num
    FROM 
        generate_series(0, 8) as slot_number, -- 9 afternoon slots
        generate_series(1, 5) as day_num -- Monday to Friday
) slots
ON CONFLICT (start_time, day_of_week) DO NOTHING;

-- Create indexes for better performance on time slot queries
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date_scheduled, time_scheduled);
CREATE INDEX IF NOT EXISTS idx_time_slots_day_time ON time_slots(day_of_week, start_time);

-- Add housing_location to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS housing_location VARCHAR(20) CHECK (housing_location IN ('dorm_1', 'dorm_2', 'off_campus')) DEFAULT 'off_campus';

-- Add health_issue_type to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS health_issue_type VARCHAR(10) CHECK (health_issue_type IN ('physical', 'mental'));

-- Update existing data with default values for new fields
UPDATE students SET housing_location = 'off_campus' WHERE housing_location IS NULL;

UPDATE medical_staff SET shift_schedule = '{"monday": ["09:00-16:00"], "tuesday": ["09:00-16:00"], "wednesday": ["09:00-16:00"], "thursday": ["09:00-16:00"], "friday": ["09:00-16:00"]}'::jsonb WHERE shift_schedule IS NULL OR shift_schedule = '{}'::jsonb;

-- Update medical staff with appropriate specialty groups
UPDATE medical_staff SET specialty_group = 'physical' WHERE specialty_group IS NULL AND specialty LIKE '%Medicine%';
UPDATE medical_staff SET specialty_group = 'mental' WHERE specialty_group IS NULL AND specialty LIKE '%Psychology%';

-- Ensure test medical staff and student exist for email tests
-- Medical staff: nhimaihello@gmail.com
INSERT INTO users (user_id, name, gender, age, role, email, password_hash, status, points)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Dr. Test Medical Staff',
    'female',
    35,
    'medical_staff',
    'nhimaihello@gmail.com',
    '$2b$12$testmedstaffpasswordhash',
    'active',
    0
) ON CONFLICT (email) DO NOTHING;

INSERT INTO medical_staff (staff_id, user_id, specialty, specialty_group, shift_schedule)
SELECT 
    '22222222-2222-2222-2222-222222222222',
    u.user_id,
    'General Medicine',
    'physical',
    '{"monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"], "wednesday": ["09:00-17:00"], "thursday": ["09:00-17:00"], "friday": ["09:00-17:00"]}'::jsonb
FROM users u WHERE u.email = 'nhimaihello@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Student: 10422061@student.vgu.edu.vn
INSERT INTO users (user_id, name, gender, age, role, email, password_hash, status, points)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Test Student',
    'other',
    22,
    'student',
    '10422061@student.vgu.edu.vn',
    '$2b$12$teststudentpasswordhash',
    'active',
    0
) ON CONFLICT (email) DO NOTHING;

INSERT INTO students (student_id, user_id, intake_year, major, housing_location)
SELECT 
    '44444444-4444-4444-4444-444444444444',
    u.user_id,
    2023,
    'Computer Science',
    'dorm_1'
FROM users u WHERE u.email = '10422061@student.vgu.edu.vn'
ON CONFLICT (user_id) DO NOTHING;

-- Set password for test users to 'VGU2024!' (bcrypt hash: $2a$12$Vykb.WuU1v3H61Fc4fBesOvr2GMahSJt56bs1j4ki6hLihZ5r4SWq)
UPDATE users SET password_hash = '$2a$12$Vykb.WuU1v3H61Fc4fBesOvr2GMahSJt56bs1j4ki6hLihZ5r4SWq'
WHERE email IN ('10422061@student.vgu.edu.vn', 'nhimaihello@gmail.com');
