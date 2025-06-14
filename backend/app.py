from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import base64
import os
from datetime import datetime
import logging
import hashlib
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'attendance_db'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'password')
}

def get_db_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

def init_database():
    """Initialize database tables"""
    conn = get_db_connection()
    if not conn:
        logger.error("Cannot initialize database - no connection")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                employee_id VARCHAR(50) UNIQUE NOT NULL,
                department VARCHAR(255),
                face_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create attendance table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                user_name VARCHAR(255) NOT NULL,
                employee_id VARCHAR(50) NOT NULL,
                department VARCHAR(255),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp)')
        
        conn.commit()
        logger.info("Database tables initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def simulate_face_recognition(image_data):
    """Simulate face recognition by returning a registered user"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM users ORDER BY created_at DESC LIMIT 1")
        user = cursor.fetchone()
        return dict(user) if user else None
    except Exception as e:
        logger.error(f"Face recognition error: {e}")
        return None
    finally:
        conn.close()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    conn = get_db_connection()
    status = 'healthy' if conn else 'database_error'
    if conn:
        conn.close()
    
    return jsonify({
        'status': status,
        'timestamp': datetime.now().isoformat(),
        'database': 'postgresql'
    })

@app.route('/api/register', methods=['POST'])
def register_user():
    """Register a new user with face data"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'employee_id', 'image']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create face hash for simulation
        face_hash = hashlib.md5(data['image'].encode()).hexdigest()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Check if employee ID already exists
            cursor.execute("SELECT id FROM users WHERE employee_id = %s", (data['employee_id'],))
            if cursor.fetchone():
                return jsonify({'error': 'Employee ID already exists'}), 400
            
            # Insert new user
            cursor.execute('''
                INSERT INTO users (name, employee_id, department, face_data)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            ''', (
                data['name'],
                data['employee_id'],
                data.get('department', ''),
                face_hash
            ))
            
            user_id = cursor.fetchone()[0]
            conn.commit()
            
            logger.info(f"User registered: {data['name']} (ID: {data['employee_id']})")
            return jsonify({
                'success': True,
                'message': 'User registered successfully',
                'user_id': user_id
            })
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Registration error: {e}")
            return jsonify({'error': 'Failed to register user'}), 500
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/mark-attendance', methods=['POST'])
def mark_attendance():
    """Mark attendance using face recognition"""
    try:
        data = request.get_json()
        
        if 'image' not in data or not data['image']:
            return jsonify({'error': 'Image data required'}), 400
        
        # Simulate face recognition
        recognized_user = simulate_face_recognition(data['image'])
        
        if not recognized_user:
            return jsonify({'error': 'Face not recognized. Please register first.'}), 404
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Record attendance with all user details
            now = datetime.now()
            cursor.execute('''
                INSERT INTO attendance (user_id, user_name, employee_id, department, timestamp, date)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (
                recognized_user['id'],
                recognized_user['name'],
                recognized_user['employee_id'],
                recognized_user['department'] or 'N/A',
                now,
                now.date()
            ))
            
            attendance_id = cursor.fetchone()[0]
            conn.commit()
            
            logger.info(f"Attendance marked for {recognized_user['name']} (ID: {recognized_user['employee_id']})")
            return jsonify({
                'success': True,
                'user_name': recognized_user['name'],
                'employee_id': recognized_user['employee_id'],
                'department': recognized_user['department'] or 'N/A',
                'timestamp': now.isoformat(),
                'attendance_id': attendance_id,
                'confidence': 0.95
            })
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Attendance marking error: {e}")
            return jsonify({'error': 'Failed to record attendance'}), 500
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Attendance marking error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/attendance-history', methods=['GET'])
def get_attendance_history():
    """Get attendance history with correct user names"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get attendance records with user details
            query = '''
                SELECT 
                    a.id,
                    a.user_name,
                    a.employee_id,
                    a.department,
                    a.timestamp,
                    a.date,
                    u.name as current_user_name
                FROM attendance a
                LEFT JOIN users u ON a.user_id = u.id
                ORDER BY a.timestamp DESC
                LIMIT 100
            '''
            cursor.execute(query)
            records = cursor.fetchall()
            
            # Convert to list of dictionaries with proper data
            attendance_records = []
            for record in records:
                attendance_records.append({
                    'id': record['id'],
                    'user_name': record['user_name'],  # Use stored name at time of attendance
                    'employee_id': record['employee_id'],
                    'department': record['department'] or 'N/A',
                    'timestamp': record['timestamp'].isoformat(),
                    'date': record['date'].isoformat()
                })
            
            logger.info(f"Fetched {len(attendance_records)} attendance records")
            return jsonify({
                'success': True,
                'records': attendance_records,
                'total': len(attendance_records)
            })
            
        except Exception as e:
            logger.error(f"Attendance history fetch error: {e}")
            return jsonify({'error': 'Failed to fetch attendance history'}), 500
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Attendance history error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all registered users"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute("SELECT id, name, employee_id, department, created_at FROM users ORDER BY created_at DESC")
            users = cursor.fetchall()
            
            # Convert to list of dictionaries
            user_list = []
            for user in users:
                user_list.append({
                    'id': user['id'],
                    'name': user['name'],
                    'employee_id': user['employee_id'],
                    'department': user['department'] or 'N/A',
                    'created_at': user['created_at'].isoformat()
                })
            
            return jsonify({
                'success': True,
                'users': user_list,
                'total': len(user_list)
            })
            
        except Exception as e:
            logger.error(f"Users fetch error: {e}")
            return jsonify({'error': 'Failed to fetch users'}), 500
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Users error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/add-demo-data', methods=['POST'])
def add_demo_data():
    """Add demo data for testing attendance history"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Demo users with real names
            demo_users = [
                ('Alice Johnson', 'EMP001', 'Engineering'),
                ('Bob Smith', 'EMP002', 'Human Resources'),
                ('Carol Davis', 'EMP003', 'Marketing'),
                ('David Wilson', 'EMP004', 'Finance')
            ]
            
            added_users = []
            for name, emp_id, dept in demo_users:
                # Check if user already exists
                cursor.execute("SELECT id FROM users WHERE employee_id = %s", (emp_id,))
                if not cursor.fetchone():
                    cursor.execute('''
                        INSERT INTO users (name, employee_id, department, face_data)
                        VALUES (%s, %s, %s, %s)
                        RETURNING id
                    ''', (name, emp_id, dept, f'demo_hash_{emp_id}'))
                    user_id = cursor.fetchone()[0]
                    added_users.append((user_id, name, emp_id, dept))
            
            # Add demo attendance records for proper testing
            cursor.execute("SELECT id, name, employee_id, department FROM users ORDER BY created_at DESC LIMIT 4")
            users = cursor.fetchall()
            
            # Add multiple attendance records per user
            for user in users:
                for day_offset in range(3):  # Last 3 days
                    for hour in [9, 13, 17]:  # Different times
                        timestamp = datetime.now().replace(
                            hour=hour, 
                            minute=0, 
                            second=0, 
                            microsecond=0
                        ).replace(day=datetime.now().day - day_offset)
                        
                        cursor.execute('''
                            INSERT INTO attendance (user_id, user_name, employee_id, department, timestamp, date)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        ''', (
                            user[0],  # id
                            user[1],  # name
                            user[2],  # employee_id
                            user[3],  # department
                            timestamp,
                            timestamp.date()
                        ))
            
            conn.commit()
            
            return jsonify({
                'success': True, 
                'message': f'Demo data added successfully. Added {len(added_users)} users with attendance records.'
            })
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Demo data error: {e}")
            return jsonify({'error': 'Failed to add demo data'}), 500
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Demo data error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Initialize database
    if init_database():
        logger.info("Starting Face Attendance System backend...")
        logger.info(f"Database: PostgreSQL at {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        logger.error("Failed to initialize database. Please check your PostgreSQL connection.")