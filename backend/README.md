# Flask Attendance Backend with PostgreSQL

## Features
- **PostgreSQL database** for reliable data storage
- **Proper user name tracking** in attendance records
- **Face recognition simulation**
- **Demo data generation** for testing
- **Comprehensive error handling**

## Quick Setup

### 1. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Windows - Download from https://www.postgresql.org/download/
```

### 2. Create Database
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE attendance_db;
CREATE USER attendance_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE attendance_db TO attendance_user;
\q
```

### 3. Setup Backend
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure database connection
cp .env.example .env
# Edit .env file with your database credentials
```

### 4. Initialize Database
```bash
# Run database setup
psql -U postgres -d attendance_db -f database_setup.sql
```

### 5. Start Server
```bash
python app.py
```

## Environment Configuration (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance_db
DB_USER=postgres
DB_PASSWORD=your_password_here
```

## API Endpoints

### Core Functionality
- `GET /api/health` - Health check with database status
- `POST /api/register` - Register new user with face data
- `POST /api/mark-attendance` - Mark attendance with face recognition
- `GET /api/attendance-history` - Get attendance records with proper names
- `GET /api/users` - Get all registered users

### Testing
- `POST /api/add-demo-data` - Add demo users and attendance records

## Key Fixes for Attendance History

1. **User names stored at attendance time** - Ensures historical accuracy
2. **Proper database relationships** - Foreign keys maintain data integrity
3. **Indexed queries** - Fast retrieval of attendance records
4. **Real user data** - No more random names in history

## Testing the Fix

1. **Start the backend:**
```bash
python app.py
```

2. **Add demo data:**
```bash
curl -X POST http://localhost:5000/api/add-demo-data
```

3. **Check attendance history:**
```bash
curl http://localhost:5000/api/attendance-history
```

4. **Verify health:**
```bash
curl http://localhost:5000/api/health
```

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `employee_id` - Unique employee identifier
- `department` - User's department
- `face_data` - Face recognition data (hash for demo)
- `created_at` - Registration timestamp

### Attendance Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `user_name` - User name at time of attendance (for history)
- `employee_id` - Employee ID at time of attendance
- `department` - Department at time of attendance
- `timestamp` - Exact attendance time
- `date` - Attendance date
- `created_at` - Record creation time

This ensures attendance history shows the correct user names without random data!