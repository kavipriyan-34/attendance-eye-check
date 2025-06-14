// Simple localStorage-based mock database for demo purposes

export interface RegisteredUser {
  name: string;
  employee_id: string;
  department: string;
  registeredAt: string;
}

export interface AttendanceRecord {
  id: number;
  user_name: string;
  employee_id: string;
  department?: string;
  timestamp: string;
  date: string;
}

// Registered Users Management
export const getRegisteredUsers = (): RegisteredUser[] => {
  const users = localStorage.getItem('faceattend_users');
  return users ? JSON.parse(users) : [];
};

export const addRegisteredUser = (user: Omit<RegisteredUser, 'registeredAt'>): void => {
  const users = getRegisteredUsers();
  const newUser: RegisteredUser = {
    ...user,
    registeredAt: new Date().toISOString()
  };
  users.push(newUser);
  localStorage.setItem('faceattend_users', JSON.stringify(users));
};

export const findUserByFace = (): RegisteredUser | null => {
  // Simulate face recognition by randomly selecting a registered user
  const users = getRegisteredUsers();
  if (users.length === 0) {
    return null;
  }
  return users[Math.floor(Math.random() * users.length)];
};

// Attendance Records Management
export const getAttendanceRecords = (): AttendanceRecord[] => {
  const records = localStorage.getItem('faceattend_attendance');
  return records ? JSON.parse(records) : [];
};

export const addAttendanceRecord = (user: RegisteredUser): AttendanceRecord => {
  const records = getAttendanceRecords();
  const newRecord: AttendanceRecord = {
    id: Date.now(), // Simple ID generation
    user_name: user.name,
    employee_id: user.employee_id,
    department: user.department,
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0]
  };
  records.push(newRecord);
  localStorage.setItem('faceattend_attendance', JSON.stringify(records));
  return newRecord;
};

// Initialize with some demo data if empty
export const initializeDemoData = (): void => {
  const users = getRegisteredUsers();
  const records = getAttendanceRecords();
  
  if (users.length === 0) {
    // Add some demo users
    const demoUsers = [
      { name: 'Demo User', employee_id: 'DEMO001', department: 'Demo Department' }
    ];
    
    demoUsers.forEach(user => addRegisteredUser(user));
  }
  
  if (records.length === 0 && users.length > 0) {
    // Add some demo attendance records
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const demoRecord: AttendanceRecord = {
      id: Date.now(),
      user_name: 'Demo User',
      employee_id: 'DEMO001',
      department: 'Demo Department',
      timestamp: yesterday.toISOString(),
      date: yesterday.toISOString().split('T')[0]
    };
    
    const records = [demoRecord];
    localStorage.setItem('faceattend_attendance', JSON.stringify(records));
  }
};