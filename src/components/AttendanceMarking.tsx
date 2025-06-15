import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CameraCapture } from './CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { Clock, User, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/lib/api';

interface AttendanceResult {
  success: boolean;
  user_name?: string;
  employee_id?: string;
  department?: string;
  timestamp?: string;
  confidence?: number;
  message?: string;
}

export const AttendanceMarking: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<AttendanceResult | null>(null);
  const { toast } = useToast();

  const handleImageCapture = async (imageData: string) => {
    setIsProcessing(true);
    
    try {
      const response = await apiService.markAttendance({ image: imageData });
      
      const result: AttendanceResult = {
        success: true,
        user_name: response.user_name,
        employee_id: response.employee_id,
        department: response.department,
        timestamp: response.timestamp,
        confidence: response.confidence
      };
      
      setLastResult(result);
      toast({
        title: "Attendance Marked",
        description: `Welcome ${response.user_name}! Attendance recorded at ${new Date(response.timestamp).toLocaleTimeString()}`
      });
      
      console.log('Attendance marked successfully:', response);
      
    } catch (error) {
      console.error('Attendance marking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setLastResult({ success: false, message: errorMessage });
      
      toast({
        title: "Recognition Failed",
        description: errorMessage.includes('not recognized') ? 
          "Face not recognized. Please ensure you are registered." :
          "Unable to connect to server. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Mark Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Position your face in the camera and capture to mark attendance
          </p>
          
          {lastResult && (
            <div className="mb-4 p-4 rounded-lg border">
              {lastResult.success ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="gap-1">
                        <User className="w-3 h-3" />
                        {lastResult.user_name}
                      </Badge>
                      <Badge variant="outline">
                        ID: {lastResult.employee_id}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Attendance marked at {lastResult.timestamp ? new Date(lastResult.timestamp).toLocaleString() : 'Unknown time'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">Recognition Failed</p>
                    <p className="text-sm text-muted-foreground">{lastResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CameraCapture
        onCapture={handleImageCapture}
        isCapturing={isProcessing}
        title="Face Recognition for Attendance"
      />
    </div>
  );
};