// API service for connecting to Flask backend
const API_BASE_URL = 'http://127.0.0.1:5000/api';

export interface RegisterUserRequest {
  name: string;
  employee_id: string;
  department?: string;
  image: string; // base64 image data
}

export interface RegisterUserResponse {
  success: boolean;
  message: string;
  user_id: number;
}

export interface MarkAttendanceRequest {
  image: string; // base64 image data
}

export interface MarkAttendanceResponse {
  success: boolean;
  user_name: string;
  employee_id: string;
  department: string;
  timestamp: string;
  attendance_id: number;
  confidence: number;
}

export interface AttendanceRecord {
  id: number;
  user_name: string;
  employee_id: string;
  department: string;
  timestamp: string;
  date: string;
}

export interface AttendanceHistoryResponse {
  success: boolean;
  records: AttendanceRecord[];
  total: number;
}

export interface User {
  id: number;
  name: string;
  employee_id: string;
  department: string;
  created_at: string;
}

export interface UsersResponse {
  success: boolean;
  users: User[];
  total: number;
}

class ApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async registerUser(userData: RegisterUserRequest): Promise<RegisterUserResponse> {
    return this.makeRequest<RegisterUserResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async markAttendance(imageData: MarkAttendanceRequest): Promise<MarkAttendanceResponse> {
    return this.makeRequest<MarkAttendanceResponse>('/mark-attendance', {
      method: 'POST',
      body: JSON.stringify(imageData),
    });
  }

  async getAttendanceHistory(): Promise<AttendanceHistoryResponse> {
    return this.makeRequest<AttendanceHistoryResponse>('/attendance-history');
  }

  async getUsers(): Promise<UsersResponse> {
    return this.makeRequest<UsersResponse>('/users');
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }

  async clearAllData(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>('/clear-data', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();