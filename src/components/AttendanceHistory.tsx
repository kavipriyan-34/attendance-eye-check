import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

interface AttendanceRecord {
  id: number;
  name: string;
  employee_id: string;
  timestamp: string;
  date: string;
  time: string;
}

export const AttendanceHistory: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        params.append('date', selectedDate);
      }
      
      const url = `${API_BASE_URL}/api/attendance-history${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.attendance_history);
        toast({
          title: "History Loaded",
          description: `Found ${data.attendance_history.length} attendance records.`,
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

  useEffect(() => {
    fetchHistory();
  }, []);

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
              <Label htmlFor="selectedDate">Filter by Date (Optional)</Label>
              <Input
                id="selectedDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={fetchHistory}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh History'}
            </Button>
          </div>

          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((record) => (
                    <div 
                      key={record.id}
                      className="flex justify-between items-center p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{record.name} ({record.employee_id})</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(record.timestamp)}
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-accent text-accent-foreground">
                        Present
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {history.length === 0 && !isLoading && (
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