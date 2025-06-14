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

// Clear all mock data (for testing purposes)
export const clearAllData = (): void => {
  localStorage.removeItem('faceattend_users');
  localStorage.removeItem('faceattend_attendance');
};
export const initializeDemoData = (): void => {
  const users = getRegisteredUsers();
  
  if (users.length === 0) {
    // Only add one demo user to get started
    const demoUser = { 
      name: 'Demo User', 
      employee_id: 'DEMO001', 
      department: 'Demo Department' 
    };
    
    addRegisteredUser(demoUser);
    console.log('Added demo user for initial setup');
  }
};