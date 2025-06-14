import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { History, Search, RefreshCw, Calendar, User } from 'lucide-react';

interface AttendanceRecord {
  id: number;
  user_name: string;
  employee_id: string;
  department?: string;
  timestamp: string;
  date: string;
}

export const AttendanceHistory: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchAttendanceHistory = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/attendance-history');
      const data = await response.json();
      
      if (response.ok) {
        setRecords(data.records || []);
        setFilteredRecords(data.records || []);
      } else {
        throw new Error(data.error || 'Failed to fetch attendance history');
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      toast({
        title: "Fetch Error",
        description: "Unable to load attendance history. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      setFilteredRecords(records);
      return;
    }

    const filtered = records.filter(record => 
      record.user_name.toLowerCase().includes(value.toLowerCase()) ||
      record.employee_id.toLowerCase().includes(value.toLowerCase()) ||
      (record.department && record.department.toLowerCase().includes(value.toLowerCase()))
    );
    
    setFilteredRecords(filtered);
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const groupedRecords = filteredRecords.reduce((groups, record) => {
    const date = record.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {} as Record<string, AttendanceRecord[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or department..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button 
              onClick={fetchAttendanceHistory}
              disabled={isLoading}
              variant="outline"
              size="icon"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading attendance records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No records found matching your search.' : 'No attendance records found.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedRecords)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, dayRecords]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{formatDate(date)}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {dayRecords.length} records
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 pl-2">
                      {dayRecords
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((record) => (
                          <Card key={record.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">{record.user_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    ID: {record.employee_id}
                                    {record.department && ` • ${record.department}`}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline">
                                {formatTime(record.timestamp)}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};