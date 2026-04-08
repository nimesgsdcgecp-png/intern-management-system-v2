-- =====================================================
-- DROP ALL TABLES
-- =====================================================
-- Run this in Hasura Console to drop all existing tables.
-- This handles foreign key dependencies automatically.
-- =====================================================

-- Drop all tables with CASCADE (handles FK dependencies)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS interns CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Drop all custom enum types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS intern_status CASCADE;
DROP TYPE IF EXISTS report_type CASCADE;

-- Verify all dropped
SELECT 'All tables dropped successfully' AS status;
