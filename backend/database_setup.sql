-- Face Attendance System Database Setup
-- Run this script after creating the attendance_app database

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(255),
    face_encoding BYTEA NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);

-- Insert sample data (optional)
-- You can uncomment these lines to add test users
/*
INSERT INTO users (name, employee_id, department, face_encoding) VALUES 
('Sample User', 'EMP001', 'IT Department', '\x00'),
('Test User', 'EMP002', 'HR Department', '\x00');
*/

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON TABLE users TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE attendance TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE attendance_id_seq TO your_app_user;

-- Create a view for attendance reports
CREATE OR REPLACE VIEW attendance_report AS
SELECT 
    u.name,
    u.employee_id,
    u.department,
    a.timestamp,
    a.date,
    TO_CHAR(a.timestamp, 'HH24:MI:SS') as time_only,
    TO_CHAR(a.date, 'Day, DD Mon YYYY') as formatted_date
FROM attendance a
JOIN users u ON a.user_id = u.id
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
        JOIN users u ON a.user_id = u.id
        WHERE u.employee_id = emp_id
    );
END;
$$ LANGUAGE plpgsql;

-- Create notification for successful setup
DO $$
BEGIN
    RAISE NOTICE 'Face Attendance System database setup completed successfully!';
    RAISE NOTICE 'Tables created: users, attendance';
    RAISE NOTICE 'Views created: attendance_report';
    RAISE NOTICE 'Functions created: get_daily_attendance_count, get_last_attendance';
END $$;