from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import face_recognition
import numpy as np
import base64
import io
from PIL import Image
import os
from datetime import datetime
import logging
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
    'database': os.getenv('DB_NAME', 'attendance_app'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'your_password_here')
}

# Create uploads directory if it doesn't exist
UPLOAD_DIR = 'uploads'
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

def decode_image(image_data):
    """Decode base64 image data"""
    try:
        # Remove data URL prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        return np.array(image)
    except Exception as e:
        logger.error(f"Image decode error: {e}")
        return None

def get_face_encoding(image_array):
    """Extract face encoding from image"""
    try:
        face_locations = face_recognition.face_locations(image_array)
        if not face_locations:
            return None
            
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        if not face_encodings:
            return None
            
        return face_encodings[0]
    except Exception as e:
        logger.error(f"Face encoding error: {e}")
        return None

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/register', methods=['POST'])
def register_user():
    """Register a new user with face encoding"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'employee_id', 'image']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Decode and process image
        image_array = decode_image(data['image'])
        if image_array is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Extract face encoding
        face_encoding = get_face_encoding(image_array)
        if face_encoding is None:
            return jsonify({'error': 'No face detected in image'}), 400
        
        # Save to database
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
            insert_query = """
                INSERT INTO users (name, employee_id, department, face_encoding, created_at)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """
            cursor.execute(insert_query, (
                data['name'],
                data['employee_id'],
                data.get('department', ''),
                face_encoding.tobytes(),
                datetime.now()
            ))
            
            user_id = cursor.fetchone()[0]
            conn.commit()
            
            logger.info(f"User registered successfully: {data['name']} (ID: {data['employee_id']})")
            return jsonify({
                'success': True,
                'message': 'User registered successfully',
                'user_id': user_id
            })
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error during registration: {e}")
            return jsonify({'error': 'Failed to save user data'}), 500
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
        
        # Decode and process image
        image_array = decode_image(data['image'])
        if image_array is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Extract face encoding
        face_encoding = get_face_encoding(image_array)
        if face_encoding is None:
            return jsonify({'error': 'No face detected in image'}), 400
        
        # Get all registered users
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute("SELECT id, name, employee_id, department, face_encoding FROM users")
            users = cursor.fetchall()
            
            if not users:
                return jsonify({'error': 'No registered users found'}), 404
            
            # Compare with registered faces
            best_match = None
            best_distance = float('inf')
            THRESHOLD = 0.6  # Adjust threshold as needed
            
            for user in users:
                stored_encoding = np.frombuffer(user['face_encoding'], dtype=np.float64)
                distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
                
                if distance < THRESHOLD and distance < best_distance:
                    best_distance = distance
                    best_match = user
            
            if best_match is None:
                return jsonify({'error': 'Face not recognized'}), 404
            
            # Record attendance
            now = datetime.now()
            attendance_query = """
                INSERT INTO attendance (user_id, timestamp, date)
                VALUES (%s, %s, %s)
                RETURNING id
            """
            cursor.execute(attendance_query, (
                best_match['id'],
                now,
                now.date()
            ))
            
            attendance_id = cursor.fetchone()['id']
            conn.commit()
            
            logger.info(f"Attendance marked for {best_match['name']} (ID: {best_match['employee_id']})")
            return jsonify({
                'success': True,
                'user_name': best_match['name'],
                'employee_id': best_match['employee_id'],
                'department': best_match['department'],
                'timestamp': now.isoformat(),
                'attendance_id': attendance_id,
                'confidence': 1 - best_distance
            })
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error during attendance marking: {e}")
            return jsonify({'error': 'Failed to record attendance'}), 500
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Attendance marking error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/attendance-history', methods=['GET'])
def get_attendance_history():
    """Get attendance history"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            query = """
                SELECT 
                    a.id,
                    u.name as user_name,
                    u.employee_id,
                    u.department,
                    a.timestamp,
                    a.date
                FROM attendance a
                JOIN users u ON a.user_id = u.id
                ORDER BY a.timestamp DESC
                LIMIT 100
            """
            cursor.execute(query)
            records = cursor.fetchall()
            
            # Convert to list of dictionaries
            attendance_records = []
            for record in records:
                attendance_records.append({
                    'id': record['id'],
                    'user_name': record['user_name'],
                    'employee_id': record['employee_id'],
                    'department': record['department'],
                    'timestamp': record['timestamp'].isoformat(),
                    'date': record['date'].isoformat()
                })
            
            return jsonify({
                'success': True,
                'records': attendance_records,
                'total': len(attendance_records)
            })
            
        except Exception as e:
            logger.error(f"Database error fetching attendance history: {e}")
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
                    'department': user['department'],
                    'created_at': user['created_at'].isoformat()
                })
            
            return jsonify({
                'success': True,
                'users': user_list,
                'total': len(user_list)
            })
            
        except Exception as e:
            logger.error(f"Database error fetching users: {e}")
            return jsonify({'error': 'Failed to fetch users'}), 500
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Users fetch error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info("Starting Face Attendance System backend...")
    logger.info(f"Database: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    app.run(debug=True, host='0.0.0.0', port=5000)