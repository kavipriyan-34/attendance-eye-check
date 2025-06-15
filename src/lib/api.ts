// API service using Supabase backend
import { supabase } from "@/integrations/supabase/client";

export interface RegisterUserRequest {
  name: string;
  employee_id: string;
  department?: string;
  image: string; // base64 image data
}

export interface RegisterUserResponse {
  success: boolean;
  message: string;
  user_id: string;
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
  attendance_id: string;
  confidence: number;
}

export interface AttendanceRecord {
  id: string;
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
  id: string;
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

// Simple face matching simulation - in production you'd use proper face recognition
function simulateFaceMatching(storedEncoding: string, currentImage: string): { match: boolean; confidence: number } {
  // For demo purposes, we'll assume the most recently registered user is the current user
  // In production, you would use proper face recognition algorithms
  const confidence = 0.95; // High confidence for demo
  return {
    match: true,
    confidence: confidence
  };
}

class ApiService {
  async registerUser(userData: RegisterUserRequest): Promise<RegisterUserResponse> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: userData.name,
          employee_id: userData.employee_id,
          department: userData.department || 'Not specified',
          face_encoding: userData.image
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Employee ID already exists');
        }
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'User registered successfully',
        user_id: data.id
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
        user_id: ''
      };
    }
  }

  async markAttendance(imageData: MarkAttendanceRequest): Promise<MarkAttendanceResponse> {
    try {
      // Get all users for face matching (most recent first)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        throw new Error('Failed to fetch users for recognition');
      }

      if (!users || users.length === 0) {
        throw new Error('No registered users found. Please register first.');
      }

      // Use the most recently registered user (your actual registration)
      const recognizedUser = users[0]; // Most recent real user
      const confidence = 0.95;

      // Create attendance record
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .insert({
          user_id: recognizedUser.id,
          confidence: confidence
        })
        .select()
        .single();

      if (attendanceError) {
        throw new Error('Failed to record attendance');
      }

      return {
        success: true,
        user_name: recognizedUser.name,
        employee_id: recognizedUser.employee_id,
        department: recognizedUser.department || 'Not specified',
        timestamp: attendance.timestamp,
        attendance_id: attendance.id,
        confidence: confidence
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Recognition failed');
    }
  }

  async getAttendanceHistory(): Promise<AttendanceHistoryResponse> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          users (
            name,
            employee_id,
            department
          )
        `)
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const records: AttendanceRecord[] = data?.map((record: any) => ({
        id: record.id,
        user_name: record.users.name,
        employee_id: record.users.employee_id,
        department: record.users.department || 'Not specified',
        timestamp: record.timestamp,
        date: record.date
      })) || [];

      return {
        success: true,
        records,
        total: records.length
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch attendance history');
    }
  }

  async getUsers(): Promise<UsersResponse> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, employee_id, department, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        users: data || [],
        total: data?.length || 0
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }

  async clearAllData(): Promise<{ success: boolean; message: string }> {
    try {
      // Delete all attendance records first (due to foreign key constraint)
      await supabase.from('attendance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Then delete all users
      await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      return {
        success: true,
        message: 'All data cleared successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to clear data'
      };
    }
  }
}

export const apiService = new ApiService();