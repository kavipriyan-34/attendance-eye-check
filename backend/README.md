# Simple Flask Attendance Backend

## Quick Setup

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Run the server:**
```bash
python app.py
```

The server will run on `http://localhost:5000` and create a SQLite database automatically.

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/register` - Register new user
- `POST /api/mark-attendance` - Mark attendance 
- `GET /api/attendance-history` - Get attendance records
- `GET /api/users` - Get all users
- `POST /api/add-demo-data` - Add demo data for testing

## Features

- SQLite database (no external DB required)
- Automatic database initialization
- Face recognition simulation
- CORS enabled for frontend
- Proper attendance history tracking
- Demo data endpoint for testing

## Testing

After starting the server, you can test by calling:
```bash
curl http://localhost:5000/api/health
```

Or add demo data:
```bash
curl -X POST http://localhost:5000/api/add-demo-data
```