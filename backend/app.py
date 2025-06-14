from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import base64
import os
from datetime import datetime
import logging
import hashlib

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database file
DB_FILE = 'attendance.db'

def init_database():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            employee_id TEXT UNIQUE NOT NULL,
            department TEXT,
            face_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create attendance table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_name TEXT NOT NULL,
            employee_id TEXT NOT NULL,
            department TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            date DATE NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def simulate_face_recognition(image_data):
    """Simulate face recognition by returning a registered user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all registered users
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    conn.close()
    
    if not users:
        return None
    
    # For demo purposes, return the first user
    # In real implementation, this would do actual face matching
    return dict(users[0])

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/register', methods=['POST'])
def register_user():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'employee_id', 'image']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create face hash for simulation (in real app, this would be face encoding)
        face_hash = hashlib.md5(data['image'].encode()).hexdigest()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if employee ID already exists
        cursor.execute("SELECT id FROM users WHERE employee_id = ?", (data['employee_id'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Employee ID already exists'}), 400
        
        # Insert new user
        cursor.execute('''
            INSERT INTO users (name, employee_id, department, face_data)
            VALUES (?, ?, ?, ?)
        ''', (
            data['name'],
            data['employee_id'],
            data.get('department', ''),
            face_hash
        ))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"User registered successfully: {data['name']} (ID: {data['employee_id']})")
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user_id
        })
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/mark-attendance', methods=['POST'])
def mark_attendance():
    """Mark attendance using face recognition simulation"""
    try:
        data = request.get_json()
        
        if 'image' not in data or not data['image']:
            return jsonify({'error': 'Image data required'}), 400
        
        # Simulate face recognition
        recognized_user = simulate_face_recognition(data['image'])
        
        if not recognized_user:
            return jsonify({'error': 'Face not recognized'}), 404
        
        # Record attendance
        conn = get_db_connection()
        cursor = conn.cursor()
        
        now = datetime.now()
        cursor.execute('''
            INSERT INTO attendance (user_id, user_name, employee_id, department, timestamp, date)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            recognized_user['id'],
            recognized_user['name'],
            recognized_user['employee_id'],
            recognized_user['department'],
            now.isoformat(),
            now.date().isoformat()
        ))
        
        attendance_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"Attendance marked for {recognized_user['name']} (ID: {recognized_user['employee_id']})")
        return jsonify({
            'success': True,
            'user_name': recognized_user['name'],
            'employee_id': recognized_user['employee_id'],
            'department': recognized_user['department'],
            'timestamp': now.isoformat(),
            'attendance_id': attendance_id,
            'confidence': 0.95
        })
        
    except Exception as e:
        logger.error(f"Attendance marking error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/attendance-history', methods=['GET'])
def get_attendance_history():
    """Get attendance history with proper data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get attendance records with user details
        cursor.execute('''
            SELECT 
                a.id,
                a.user_name,
                a.employee_id,
                a.department,
                a.timestamp,
                a.date
            FROM attendance a
            ORDER BY a.timestamp DESC
            LIMIT 100
        ''')
        
        records = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        attendance_records = []
        for record in records:
            attendance_records.append({
                'id': record['id'],
                'user_name': record['user_name'],
                'employee_id': record['employee_id'],
                'department': record['department'] or 'N/A',
                'timestamp': record['timestamp'],
                'date': record['date']
            })
        
        logger.info(f"Fetched {len(attendance_records)} attendance records")
        return jsonify({
            'success': True,
            'records': attendance_records,
            'total': len(attendance_records)
        })
        
    except Exception as e:
        logger.error(f"Attendance history error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all registered users"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, employee_id, department, created_at FROM users ORDER BY created_at DESC")
        users = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        user_list = []
        for user in users:
            user_list.append({
                'id': user['id'],
                'name': user['name'],
                'employee_id': user['employee_id'],
                'department': user['department'] or 'N/A',
                'created_at': user['created_at']
            })
        
        return jsonify({
            'success': True,
            'users': user_list,
            'total': len(user_list)
        })
        
    except Exception as e:
        logger.error(f"Users fetch error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/add-demo-data', methods=['POST'])
def add_demo_data():
    """Add demo data for testing"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Add demo users
        demo_users = [
            ('John Doe', 'EMP001', 'Engineering'),
            ('Jane Smith', 'EMP002', 'HR'),
            ('Mike Johnson', 'EMP003', 'Marketing')
        ]
        
        for name, emp_id, dept in demo_users:
            # Check if user already exists
            cursor.execute("SELECT id FROM users WHERE employee_id = ?", (emp_id,))
            if not cursor.fetchone():
                cursor.execute('''
                    INSERT INTO users (name, employee_id, department, face_data)
                    VALUES (?, ?, ?, ?)
                ''', (name, emp_id, dept, 'demo_hash'))
        
        # Add demo attendance records
        cursor.execute("SELECT id, name, employee_id, department FROM users LIMIT 3")
        users = cursor.fetchall()
        
        for user in users:
            # Add a few attendance records for each user
            for i in range(3):
                timestamp = datetime.now().replace(hour=9+i, minute=0, second=0)
                cursor.execute('''
                    INSERT INTO attendance (user_id, user_name, employee_id, department, timestamp, date)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    user['id'],
                    user['name'],
                    user['employee_id'],
                    user['department'],
                    timestamp.isoformat(),
                    timestamp.date().isoformat()
                ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Demo data added successfully'})
        
    except Exception as e:
        logger.error(f"Demo data error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Initialize database
    init_database()
    
    logger.info("Starting Face Attendance System backend...")
    logger.info("Database: SQLite (attendance.db)")
    app.run(debug=True, host='0.0.0.0', port=5000)