import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CameraCapture } from './CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { Camera } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

interface AttendanceResult {
  status: 'success' | 'failed';
  message: string;
  user_id?: number;
  user_name?: string;
  match_distance?: number;
}

export const AttendanceMarking: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<AttendanceResult | null>(null);
  const { toast } = useToast();

  const handleImageCapture = async (imageData: string) => {
    setIsSubmitting(true);
    setLastResult(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/mark_attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData
        }),
      });

      const data: AttendanceResult = await response.json();
      setLastResult(data);
      
      if (response.ok && data.status === 'success') {
        toast({
          title: "Attendance Marked",
          description: data.message,
        });
      } else {
        toast({
          title: "Attendance Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = 'Failed to connect to server. Please check your connection.';
      setLastResult({
        status: 'failed',
        message: errorMessage
      });
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Mark Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Position your face in the camera and capture to mark attendance
            </p>
          </div>
          
          <CameraCapture 
            onCapture={handleImageCapture}
            isCapturing={isSubmitting}
          />

          {lastResult && (
            <Card className={`border-2 ${
              lastResult.status === 'success' 
                ? 'border-accent bg-accent/5' 
                : 'border-destructive bg-destructive/5'
            }`}>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className={`text-lg font-semibold ${
                    lastResult.status === 'success' 
                      ? 'text-accent' 
                      : 'text-destructive'
                  }`}>
                    {lastResult.status === 'success' ? '✓ Success' : '✗ Failed'}
                  </div>
                  
                  <p className="text-foreground font-medium">
                    {lastResult.message}
                  </p>
                  
                  {lastResult.user_name && (
                    <p className="text-lg font-bold text-primary">
                      Welcome, {lastResult.user_name}!
                    </p>
                  )}
                  
                  {lastResult.match_distance !== undefined && (
                    <p className="text-sm text-muted-foreground">
                      Match confidence: {(1 - lastResult.match_distance).toFixed(3)}
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};