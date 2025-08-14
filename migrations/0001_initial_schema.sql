-- AlphaClassBot Database Schema
-- Academic scheduling system with multi-role support

-- Users table: stores all users (students, teachers, admins)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences TEXT, -- JSON string for user preferences
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Institutions/Schools table
CREATE TABLE IF NOT EXISTS institutions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  timezone TEXT DEFAULT 'UTC',
  academic_year_start TEXT, -- Format: YYYY-MM-DD
  academic_year_end TEXT,   -- Format: YYYY-MM-DD
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User-Institution relationships (users can belong to multiple institutions)
CREATE TABLE IF NOT EXISTS user_institutions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  institution_id INTEGER NOT NULL,
  role_in_institution TEXT NOT NULL CHECK (role_in_institution IN ('student', 'teacher', 'admin')),
  student_id TEXT, -- For students
  employee_id TEXT, -- For teachers/staff
  department TEXT,
  is_active INTEGER DEFAULT 1,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  UNIQUE(user_id, institution_id)
);

-- Subjects/Courses table
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institution_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER DEFAULT 0,
  department TEXT,
  semester TEXT,
  academic_year TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  UNIQUE(institution_id, code, academic_year, semester)
);

-- Classes/Sections table
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  section_name TEXT NOT NULL,
  max_students INTEGER DEFAULT 50,
  room TEXT,
  schedule_pattern TEXT, -- JSON string: [{"day": "monday", "start_time": "09:00", "end_time": "10:30"}]
  start_date TEXT, -- Format: YYYY-MM-DD
  end_date TEXT,   -- Format: YYYY-MM-DD
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Student enrollments in classes
CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  enrollment_date DATE DEFAULT (date('now')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed', 'withdrawn')),
  grade TEXT,
  final_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE(student_id, class_id)
);

-- Schedule events (individual class sessions, exams, assignments, etc.)
CREATE TABLE IF NOT EXISTS schedule_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER,
  creator_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('class', 'exam', 'assignment', 'meeting', 'holiday', 'custom')),
  start_datetime TEXT NOT NULL, -- ISO 8601 format: YYYY-MM-DDTHH:MM:SS
  end_datetime TEXT NOT NULL,
  location TEXT,
  is_recurring INTEGER DEFAULT 0,
  recurrence_pattern TEXT, -- JSON string for recurring events
  is_cancelled INTEGER DEFAULT 0,
  cancellation_reason TEXT,
  reminder_settings TEXT, -- JSON string: {"enabled": true, "minutes_before": [15, 60]}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  reminder_time TEXT NOT NULL, -- ISO 8601 format
  message TEXT,
  is_sent INTEGER DEFAULT 0,
  notification_method TEXT DEFAULT 'in_app' CHECK (notification_method IN ('in_app', 'email', 'sms', 'push')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES schedule_events(id) ON DELETE CASCADE
);

-- Chat conversations for AI-powered scheduling
CREATE TABLE IF NOT EXISTS chat_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT,
  context TEXT, -- JSON string for conversation context
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'assistant')),
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'schedule_request', 'schedule_response', 'reminder_setup')),
  metadata TEXT, -- JSON string for additional message data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'schedule_change', 'enrollment', 'announcement', 'system')),
  is_read INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  action_url TEXT,
  metadata TEXT, -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  is_public INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_institutions_user ON user_institutions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_institutions_institution ON user_institutions(institution_id);
CREATE INDEX IF NOT EXISTS idx_subjects_institution ON subjects(institution_id);
CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_class ON schedule_events(class_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_creator ON schedule_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_start_time ON schedule_events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_event ON reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);