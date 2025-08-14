-- AlphaClassBot Sample Data
-- This file seeds the database with demo data for testing

-- Insert sample institutions
INSERT OR IGNORE INTO institutions (name, code, address, phone, email, timezone, academic_year_start, academic_year_end) VALUES 
  ('Tech University', 'TU', '123 Tech Street, Tech City', '+1-555-0101', 'admin@techuniversity.edu', 'America/New_York', '2024-09-01', '2025-05-31'),
  ('Creative Arts College', 'CAC', '456 Arts Avenue, Creative City', '+1-555-0102', 'info@creativearts.edu', 'America/Los_Angeles', '2024-08-15', '2025-05-15');

-- Insert sample users (password is 'password123' hashed - in real app, use proper bcrypt)
INSERT OR IGNORE INTO users (email, password_hash, name, role, phone, timezone) VALUES 
  ('admin@techuniversity.edu', '$2a$10$sample.hash.for.demo.purposes.only', 'Dr. Alice Anderson', 'admin', '+1-555-1001', 'America/New_York'),
  ('john.teacher@techuniversity.edu', '$2a$10$sample.hash.for.demo.purposes.only', 'Prof. John Smith', 'teacher', '+1-555-1002', 'America/New_York'),
  ('mary.teacher@techuniversity.edu', '$2a$10$sample.hash.for.demo.purposes.only', 'Dr. Mary Johnson', 'teacher', '+1-555-1003', 'America/New_York'),
  ('student1@student.techuniversity.edu', '$2a$10$sample.hash.for.demo.purposes.only', 'Alex Chen', 'student', '+1-555-2001', 'America/New_York'),
  ('student2@student.techuniversity.edu', '$2a$10$sample.hash.for.demo.purposes.only', 'Sarah Williams', 'student', '+1-555-2002', 'America/New_York'),
  ('student3@student.techuniversity.edu', '$2a$10$sample.hash.for.demo.purposes.only', 'Mike Davis', 'student', '+1-555-2003', 'America/New_York'),
  ('emma.student@student.techuniversity.edu', '$2a$10$sample.hash.for.demo.purposes.only', 'Emma Brown', 'student', '+1-555-2004', 'America/New_York');

-- Link users to institutions
INSERT OR IGNORE INTO user_institutions (user_id, institution_id, role_in_institution, student_id, employee_id, department) VALUES 
  (1, 1, 'admin', NULL, 'ADMIN001', 'Administration'),
  (2, 1, 'teacher', NULL, 'PROF001', 'Computer Science'),
  (3, 1, 'teacher', NULL, 'PROF002', 'Mathematics'),
  (4, 1, 'student', 'STU001', NULL, 'Computer Science'),
  (5, 1, 'student', 'STU002', NULL, 'Computer Science'),
  (6, 1, 'student', 'STU003', NULL, 'Mathematics'),
  (7, 1, 'student', 'STU004', NULL, 'Computer Science');

-- Insert sample subjects
INSERT OR IGNORE INTO subjects (institution_id, code, name, description, credits, department, semester, academic_year) VALUES 
  (1, 'CS101', 'Introduction to Programming', 'Basic programming concepts using Python', 3, 'Computer Science', 'Fall', '2024-2025'),
  (1, 'CS201', 'Data Structures and Algorithms', 'Advanced programming and problem solving', 4, 'Computer Science', 'Spring', '2024-2025'),
  (1, 'MATH201', 'Calculus II', 'Integral calculus and series', 4, 'Mathematics', 'Spring', '2024-2025'),
  (1, 'CS301', 'Database Systems', 'Database design and SQL', 3, 'Computer Science', 'Fall', '2024-2025');

-- Insert sample classes
INSERT OR IGNORE INTO classes (subject_id, teacher_id, section_name, max_students, room, schedule_pattern, start_date, end_date) VALUES 
  (1, 2, 'Section A', 30, 'CS-101', '[{"day": "monday", "start_time": "09:00", "end_time": "10:30"}, {"day": "wednesday", "start_time": "09:00", "end_time": "10:30"}, {"day": "friday", "start_time": "09:00", "end_time": "10:30"}]', '2024-09-01', '2024-12-15'),
  (2, 2, 'Section A', 25, 'CS-201', '[{"day": "tuesday", "start_time": "14:00", "end_time": "15:30"}, {"day": "thursday", "start_time": "14:00", "end_time": "15:30"}]', '2025-01-15', '2025-05-15'),
  (3, 3, 'Section A', 35, 'MATH-201', '[{"day": "monday", "start_time": "11:00", "end_time": "12:30"}, {"day": "wednesday", "start_time": "11:00", "end_time": "12:30"}, {"day": "friday", "start_time": "11:00", "end_time": "12:30"}]', '2025-01-15', '2025-05-15'),
  (4, 2, 'Section A', 20, 'CS-301', '[{"day": "tuesday", "start_time": "10:00", "end_time": "11:30"}, {"day": "thursday", "start_time": "10:00", "end_time": "11:30"}]', '2024-09-01', '2024-12-15');

-- Insert sample enrollments
INSERT OR IGNORE INTO enrollments (student_id, class_id, enrollment_date, status) VALUES 
  (4, 1, '2024-08-15', 'active'),  -- Alex in CS101
  (5, 1, '2024-08-15', 'active'),  -- Sarah in CS101
  (7, 1, '2024-08-15', 'active'),  -- Emma in CS101
  (4, 4, '2024-08-15', 'active'),  -- Alex in CS301 (Database Systems)
  (5, 2, '2024-12-20', 'active'),  -- Sarah in CS201 (next semester)
  (6, 3, '2024-12-20', 'active'),  -- Mike in MATH201
  (7, 2, '2024-12-20', 'active');  -- Emma in CS201

-- Insert sample schedule events
INSERT OR IGNORE INTO schedule_events (class_id, creator_id, title, description, event_type, start_datetime, end_datetime, location, reminder_settings) VALUES 
  (1, 2, 'CS101 - Introduction to Python', 'First class: Python basics and environment setup', 'class', '2024-09-02T09:00:00', '2024-09-02T10:30:00', 'CS-101', '{"enabled": true, "minutes_before": [15, 60]}'),
  (1, 2, 'CS101 - Variables and Data Types', 'Learning about Python variables and basic data types', 'class', '2024-09-04T09:00:00', '2024-09-04T10:30:00', 'CS-101', '{"enabled": true, "minutes_before": [15, 60]}'),
  (1, 2, 'CS101 - Midterm Exam', 'Midterm examination covering first half of semester', 'exam', '2024-10-15T09:00:00', '2024-10-15T11:00:00', 'CS-101', '{"enabled": true, "minutes_before": [30, 1440, 10080]}'),
  (1, 2, 'CS101 - Assignment 1 Due', 'First programming assignment submission deadline', 'assignment', '2024-09-20T23:59:00', '2024-09-20T23:59:00', 'Online', '{"enabled": true, "minutes_before": [60, 1440, 4320]}'),
  (4, 2, 'CS301 - Database Design Project Presentation', 'Final project presentations', 'class', '2024-12-10T10:00:00', '2024-12-10T11:30:00', 'CS-301', '{"enabled": true, "minutes_before": [30, 1440]}');

-- Insert sample chat conversations
INSERT OR IGNORE INTO chat_conversations (user_id, title, context) VALUES 
  (4, 'Schedule Help - Week 1', '{"topic": "scheduling", "week": 1, "semester": "fall2024"}'),
  (5, 'Assignment Reminders Setup', '{"topic": "reminders", "focus": "assignments"}'),
  (7, 'Class Schedule Optimization', '{"topic": "scheduling", "goal": "optimize_study_time"}');

-- Insert sample chat messages
INSERT OR IGNORE INTO chat_messages (conversation_id, sender_type, message, message_type) VALUES 
  (1, 'user', 'Hi, can you help me understand my schedule for this week?', 'text'),
  (1, 'assistant', 'Of course! Based on your enrollments, you have CS101 on Monday, Wednesday, and Friday at 9:00 AM, and CS301 on Tuesday and Thursday at 10:00 AM. Would you like me to set up reminders for these classes?', 'schedule_response'),
  (1, 'user', 'Yes, please set up 15-minute reminders for all my classes.', 'schedule_request'),
  (1, 'assistant', 'Perfect! I\'ve set up 15-minute reminders for all your classes. You\'ll receive notifications before each CS101 and CS301 session. Is there anything else you\'d like to know about your schedule?', 'reminder_setup'),
  (2, 'user', 'I need help setting up reminders for assignment deadlines.', 'text'),
  (2, 'assistant', 'I can help you with that! I see you have Assignment 1 due for CS101 on September 20th at 11:59 PM. Would you like me to set up multiple reminders - perhaps 1 day before, 1 hour before, and 1 week before the deadline?', 'schedule_response'),
  (3, 'user', 'Can you suggest the best times for me to study based on my class schedule?', 'text'),
  (3, 'assistant', 'Based on your schedule, I recommend studying: Tuesday 12:00-2:00 PM (between CS301 and free time), Thursday 12:00-2:00 PM (same gap), and weekends. You have gaps on Tuesday/Thursday afternoons and completely free weekends that would be perfect for focused study sessions.', 'text');

-- Insert sample notifications
INSERT OR IGNORE INTO notifications (user_id, title, message, type, priority, action_url) VALUES 
  (4, 'Class Reminder', 'CS101 - Introduction to Python starts in 15 minutes in room CS-101', 'reminder', 'high', '/schedule'),
  (4, 'Assignment Due Soon', 'CS101 Assignment 1 is due in 1 day (September 20, 11:59 PM)', 'reminder', 'medium', '/assignments'),
  (5, 'New Class Added', 'You have been enrolled in CS201 - Data Structures and Algorithms for Spring 2025', 'enrollment', 'medium', '/classes'),
  (5, 'Schedule Change', 'CS101 class on Friday has been moved to room CS-102', 'schedule_change', 'high', '/schedule'),
  (7, 'Welcome!', 'Welcome to AlphaClassBot! Start by exploring your dashboard and setting up your preferences.', 'system', 'low', '/dashboard');

-- Insert sample system settings
INSERT OR IGNORE INTO system_settings (key, value, description, is_public) VALUES 
  ('app_name', 'AlphaClassBot', 'Application name', 1),
  ('app_version', '1.0.0', 'Current application version', 1),
  ('default_reminder_minutes', '15', 'Default reminder time in minutes', 0),
  ('max_classes_per_student', '8', 'Maximum classes a student can enroll in per semester', 0),
  ('academic_year', '2024-2025', 'Current academic year', 1),
  ('support_email', 'support@alphaclassbot.com', 'Support contact email', 1),
  ('maintenance_mode', 'false', 'Whether the system is in maintenance mode', 0);