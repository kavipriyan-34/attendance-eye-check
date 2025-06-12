from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import cv2
import numpy as np
import os
import psycopg2
from datetime import datetime
import base64
from io import BytesIO
from PIL import Image
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'attendance_app'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'password'),
    'port': os.getenv('DB_PORT', '5432')
}

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def base64_to_image(base64_string):
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert PIL Image to numpy array
        image_array = np.array(image)
        return image_array
    except Exception as e:
        print(f"Error converting base64 to image: {e}")
        return None

@app.route('/api/register', methods=['POST'])
def register_user():
    try:
        data = request.json
        name = data.get('name')
        employee_id = data.get('employee_id')
        image_data = data.get('image')  # base64 encoded image
        
        if not all([name, employee_id, image_data]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Convert base64 to image
        image = base64_to_image(image_data)
        if image is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Extract face encoding
        face_locations = face_recognition.face_locations(image)
        if not face_locations:
            return jsonify({'error': 'No face detected in image'}), 400
        
        face_encodings = face_recognition.face_encodings(image, face_locations)
        if not face_encodings:
            return jsonify({'error': 'Could not extract face features'}), 400
        
        face_encoding = face_encodings[0]
        
        # Save image
        image_filename = f"{employee_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        image_path = os.path.join(UPLOAD_FOLDER, image_filename)
        Image.fromarray(image).save(image_path)
        
        # Save to database
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (name, employee_id, face_encoding, image_path, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (name, employee_id, json.dumps(face_encoding.tolist()), image_path, datetime.now()))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'User registered successfully', 'user_id': employee_id}), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/mark-attendance', methods=['POST'])
def mark_attendance():
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Convert base64 to image
        image = base64_to_image(image_data)
        if image is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Extract face encoding from uploaded image
        face_locations = face_recognition.face_locations(image)
        if not face_locations:
            return jsonify({'error': 'No face detected'}), 400
        
        face_encodings = face_recognition.face_encodings(image, face_locations)
        if not face_encodings:
            return jsonify({'error': 'Could not extract face features'}), 400
        
        unknown_face_encoding = face_encodings[0]
        
        # Get all registered users
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, employee_id, face_encoding FROM users")
        users = cursor.fetchall()
        
        # Compare with registered faces
        for user in users:
            user_id, name, employee_id, face_encoding_json = user
            stored_encoding = np.array(json.loads(face_encoding_json))
            
            # Compare faces
            matches = face_recognition.compare_faces([stored_encoding], unknown_face_encoding, tolerance=0.6)
            
            if matches[0]:
                # Check if already marked today
                today = datetime.now().date()
                cursor.execute("""
                    SELECT id FROM attendance 
                    WHERE user_id = %s AND DATE(timestamp) = %s
                """, (user_id, today))
                
                existing_record = cursor.fetchone()
                
                if existing_record:
                    cursor.close()
                    conn.close()
                    return jsonify({
                        'message': f'Attendance already marked for {name} today',
                        'user': {'name': name, 'employee_id': employee_id},
                        'already_marked': True
                    }), 200
                
                # Mark attendance
                cursor.execute("""
                    INSERT INTO attendance (user_id, timestamp)
                    VALUES (%s, %s)
                """, (user_id, datetime.now()))
                
                conn.commit()
                cursor.close()
                conn.close()
                
                return jsonify({
                    'message': f'Attendance marked successfully for {name}',
                    'user': {'name': name, 'employee_id': employee_id},
                    'timestamp': datetime.now().isoformat()
                }), 200
        
        cursor.close()
        conn.close()
        return jsonify({'error': 'Face not recognized'}), 404
        
    except Exception as e:
        print(f"Attendance marking error: {e}")
        return jsonify({'error': 'Attendance marking failed'}), 500

@app.route('/api/attendance-history', methods=['GET'])
def get_attendance_history():
    try:
        # Get query parameters
        date = request.args.get('date')  # Format: YYYY-MM-DD
        user_id = request.args.get('user_id')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        
        # Build query based on parameters
        query = """
            SELECT a.id, u.name, u.employee_id, a.timestamp
            FROM attendance a
            JOIN users u ON a.user_id = u.id
        """
        params = []
        conditions = []
        
        if date:
            conditions.append("DATE(a.timestamp) = %s")
            params.append(date)
        
        if user_id:
            conditions.append("u.id = %s")
            params.append(user_id)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY a.timestamp DESC"
        
        cursor.execute(query, params)
        records = cursor.fetchall()
        
        attendance_history = []
        for record in records:
            attendance_id, name, employee_id, timestamp = record
            attendance_history.append({
                'id': attendance_id,
                'name': name,
                'employee_id': employee_id,
                'timestamp': timestamp.isoformat(),
                'date': timestamp.strftime('%Y-%m-%d'),
                'time': timestamp.strftime('%H:%M:%S')
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({'attendance_history': attendance_history}), 200
        
    except Exception as e:
        print(f"History retrieval error: {e}")
        return jsonify({'error': 'Failed to retrieve attendance history'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, employee_id, created_at FROM users ORDER BY created_at DESC")
        users = cursor.fetchall()
        
        user_list = []
        for user in users:
            user_id, name, employee_id, created_at = user
            user_list.append({
                'id': user_id,
                'name': name,
                'employee_id': employee_id,
                'created_at': created_at.isoformat()
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({'users': user_list}), 200
        
    except Exception as e:
        print(f"Users retrieval error: {e}")
        return jsonify({'error': 'Failed to retrieve users'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)