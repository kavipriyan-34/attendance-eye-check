import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

interface AttendanceRecord {
  timestamp: string;
  status: string;
}

export const AttendanceHistory: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    if (!userId) {
      toast({
        title: "Missing User ID",
        description: "Please enter a valid user ID.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/attendance_history/${userId}`);
      
      if (response.ok) {
        const data: AttendanceRecord[] = await response.json();
        setHistory(data);
        toast({
          title: "History Loaded",
          description: `Found ${data.length} attendance records.`,
        });
      } else {
        throw new Error('Failed to fetch attendance history');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance history. Please try again.",
        variant: "destructive",
      });
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="number"
                placeholder="Enter user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <Button 
              onClick={fetchHistory}
              disabled={isLoading || !userId}
            >
              {isLoading ? 'Loading...' : 'View History'}
            </Button>
          </div>

          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((record, index) => (
                    <div 
                      key={index}
                      className="flex justify-between items-center p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">Status: {record.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(record.timestamp)}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        record.status === 'Present' 
                          ? 'bg-accent text-accent-foreground' 
                          : 'bg-muted-foreground text-muted'
                      }`}>
                        {record.status}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {history.length === 0 && userId && !isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2" />
                  <p>No attendance records found for this user.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};