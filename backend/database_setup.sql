-- Face Attendance System Database Setup for PostgreSQL
-- Run this after creating the attendance_db database

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(255),
    face_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table with proper user name storage
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    department VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);

-- Create view for attendance reports
CREATE OR REPLACE VIEW attendance_report AS
SELECT 
    a.id,
    a.user_name,
    a.employee_id,
    a.department,
    a.timestamp,
    a.date,
    TO_CHAR(a.timestamp, 'HH24:MI:SS') as time_only,
    TO_CHAR(a.date, 'Day, DD Mon YYYY') as formatted_date,
    u.name as current_user_name
FROM attendance a
LEFT JOIN users u ON a.user_id = u.id
ORDER BY a.timestamp DESC;

-- Function to get daily attendance count
CREATE OR REPLACE FUNCTION get_daily_attendance_count(target_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT user_id)
        FROM attendance
        WHERE date = target_date
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's last attendance
CREATE OR REPLACE FUNCTION get_last_attendance(emp_id VARCHAR)
RETURNS TIMESTAMP AS $$
BEGIN
    RETURN (
        SELECT MAX(a.timestamp)
        FROM attendance a
        WHERE a.employee_id = emp_id
    );
END;
$$ LANGUAGE plpgsql;

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'Face Attendance System database setup completed successfully!';
    RAISE NOTICE 'Tables created: users, attendance';
    RAISE NOTICE 'View created: attendance_report';
    RAISE NOTICE 'Functions created: get_daily_attendance_count, get_last_attendance';
    RAISE NOTICE 'Ready for attendance tracking with proper user name storage!';
END $$;