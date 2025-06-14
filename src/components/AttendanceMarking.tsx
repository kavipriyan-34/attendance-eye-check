import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CameraCapture } from './CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { Clock, User, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AttendanceResult {
  success: boolean;
  user_name?: string;
  employee_id?: string;
  timestamp?: string;
  message?: string;
}

export const AttendanceMarking: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<AttendanceResult | null>(null);
  const { toast } = useToast();

  const handleImageCapture = async (imageData: string) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/mark-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setLastResult(data);
        toast({
          title: "Attendance Marked",
          description: `Welcome ${data.user_name}! Attendance recorded at ${new Date(data.timestamp).toLocaleTimeString()}`
        });
      } else {
        setLastResult({ success: false, message: data.error || 'Face not recognized' });
        toast({
          title: "Recognition Failed",
          description: data.error || "Face not recognized. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Attendance marking error:', error);
      setLastResult({ success: false, message: 'Network error occurred' });
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
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