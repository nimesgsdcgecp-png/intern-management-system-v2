    -- =====================================================
    -- Intern Management System - Fresh Schema
    -- =====================================================
    -- PostgreSQL 14+ Compatible | Hasura GraphQL Compatible
    -- 
    -- INSTRUCTIONS:
    -- 1. Run drop_all.sql first to clear existing tables
    -- 2. Then run this file to create the new schema
    -- =====================================================

    -- -----------------------------------------------------------------------------
    -- ENUM TYPES
    -- -----------------------------------------------------------------------------
    CREATE TYPE user_role AS ENUM ('admin', 'mentor', 'intern');
    CREATE TYPE task_status AS ENUM ('pending', 'in-progress', 'review', 'completed');
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
    CREATE TYPE intern_status AS ENUM ('active', 'completed', 'terminated', 'paused');

    -- -----------------------------------------------------------------------------
    -- DEPARTMENTS TABLE
    -- -----------------------------------------------------------------------------
    CREATE TABLE departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        head_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- -----------------------------------------------------------------------------
    -- USERS TABLE
    -- -----------------------------------------------------------------------------
    CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
        password_hash TEXT NOT NULL,
        role user_role NOT NULL,
        department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Add department head FK (circular reference, must be added after users exists)
    ALTER TABLE departments ADD CONSTRAINT fk_departments_head 
        FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL;

    -- -----------------------------------------------------------------------------
    -- PROFILES TABLE
    -- -----------------------------------------------------------------------------
    CREATE TABLE profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- -----------------------------------------------------------------------------
    -- INTERNS TABLE
    -- -----------------------------------------------------------------------------
    CREATE TABLE interns (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_by_admin UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        college_name TEXT,
        university TEXT,
        start_date DATE,
        end_date DATE,
        status intern_status NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT interns_date_check CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
    );

    -- -----------------------------------------------------------------------------
    -- TASKS TABLE (no status - status is per-assignment)
    -- -----------------------------------------------------------------------------
    CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        assigned_to_all BOOLEAN NOT NULL DEFAULT FALSE,
        deadline DATE,
        priority task_priority NOT NULL DEFAULT 'medium',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- -----------------------------------------------------------------------------
    -- TASK ASSIGNMENTS TABLE (with per-intern status)
    -- -----------------------------------------------------------------------------
    CREATE TABLE task_assignments (
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        intern_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status task_status NOT NULL DEFAULT 'pending',
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (task_id, intern_id)
    );

    -- -----------------------------------------------------------------------------
    -- REPORTS TABLE (one per intern per day)
    -- -----------------------------------------------------------------------------
    CREATE TABLE reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        intern_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        report_date DATE NOT NULL,
        work_description TEXT NOT NULL,
        hours_worked NUMERIC(4,2) NOT NULL CHECK (hours_worked >= 0 AND hours_worked <= 24),
        mentor_feedback TEXT,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT unique_intern_report_date UNIQUE (intern_id, report_date)
    );

    -- -----------------------------------------------------------------------------
    -- ATTENDANCE TABLE (one per user per day)
    -- -----------------------------------------------------------------------------
    CREATE TABLE attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        clock_out TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'present',
        total_hours NUMERIC(4,2),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT unique_user_date UNIQUE (user_id, date)
    );

    -- -----------------------------------------------------------------------------
    -- EVENTS TABLE (NULL department_id = global event)
    -- -----------------------------------------------------------------------------
    CREATE TABLE events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        location TEXT,
        department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT events_time_check CHECK (end_time > start_time)
    );

    -- -----------------------------------------------------------------------------
    -- ACTIVITY LOGS TABLE
    -- -----------------------------------------------------------------------------
    CREATE TABLE activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id UUID,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- -----------------------------------------------------------------------------
    -- PASSWORD RESET TOKENS TABLE
    -- -----------------------------------------------------------------------------
    CREATE TABLE password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        token TEXT UNIQUE,
        otp_code TEXT,
        type TEXT NOT NULL CHECK (type IN ('otp', 'reset')),
        expires_at TIMESTAMPTZ NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- -----------------------------------------------------------------------------
    -- INDEXES
    -- -----------------------------------------------------------------------------
    -- Departments
    CREATE INDEX idx_departments_name ON departments(name);
    CREATE INDEX idx_departments_head_id ON departments(head_id);

    -- Users
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_role ON users(role);
    CREATE INDEX idx_users_department_id ON users(department_id);

    -- Profiles
    CREATE INDEX idx_profiles_name ON profiles(name);

    -- Interns
    CREATE INDEX idx_interns_mentor_id ON interns(mentor_id);
    CREATE INDEX idx_interns_created_by_admin ON interns(created_by_admin);
    CREATE INDEX idx_interns_status ON interns(status);

    -- Tasks
    CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
    CREATE INDEX idx_tasks_priority ON tasks(priority);
    CREATE INDEX idx_tasks_deadline ON tasks(deadline);

    -- Task Assignments
    CREATE INDEX idx_task_assignments_intern_id ON task_assignments(intern_id);
    CREATE INDEX idx_task_assignments_status ON task_assignments(status);

    -- Reports
    CREATE INDEX idx_reports_intern_id ON reports(intern_id);
    CREATE INDEX idx_reports_report_date ON reports(report_date);

    -- Attendance
    CREATE INDEX idx_attendance_user_id ON attendance(user_id);
    CREATE INDEX idx_attendance_date ON attendance(date);

    -- Events
    CREATE INDEX idx_events_created_by ON events(created_by);
    CREATE INDEX idx_events_start_time ON events(start_time);
    CREATE INDEX idx_events_department_id ON events(department_id);

    -- Activity Logs
    CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
    CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

    -- Password Reset Tokens
    CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
    CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

    -- -----------------------------------------------------------------------------
    -- SEED DATA
    -- -----------------------------------------------------------------------------
    -- Insert departments
    INSERT INTO departments (name) VALUES
        ('AI'), ('ODOO'), ('JAVA'), ('MOBILE'), ('SAP'), ('QC'), ('PHP'), ('RPA');

    -- Insert admin user
    INSERT INTO users (id, email, password_hash, role, department_id)
    SELECT 
        'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
        'admin@internship.com',
        '$2b$10$6ItCzbH7kFFuk5kKOIdgxOUOMJ.YNN1DF627B.0nHuVWvbMDrV3AG',
        'admin',
        id
    FROM departments WHERE name = 'AI';

    -- Insert admin profile
    INSERT INTO profiles (user_id, name)
    VALUES ('aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid, 'Aarav Shah');
