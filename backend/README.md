# Face Attendance Backend

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Setup
1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE attendance_app;
   ```
3. Run the database setup:
   ```bash
   psql -U postgres -d attendance_app -f database_setup.sql
   ```

### 3. Environment Configuration
1. Copy `.env` file and update your database credentials
2. Update `DB_PASSWORD` with your PostgreSQL password

### 4. Run the Server
```bash
python app.py
```

The server will run on `http://localhost:5000`

## API Endpoints

- `POST /api/register` - Register new user with face
- `POST /api/mark-attendance` - Mark attendance using face
- `GET /api/attendance-history` - Get attendance records
- `GET /api/users` - Get all registered users
- `GET /api/health` - Health check

## Frontend Integration

Your React frontend will automatically connect to this backend on localhost:5000.