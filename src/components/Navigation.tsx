import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Users, User, Trash2 } from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface NavigationProps {
  activeView: 'register' | 'attendance' | 'history';
  onViewChange: (view: 'register' | 'attendance' | 'history') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange }) => {
  const { toast } = useToast();

  const handleClearData = async () => {
    try {
      const result = await apiService.clearAllData();
      if (result.success) {
        toast({
          title: "Success",
          description: "All demo data and records cleared successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear data",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    {
      id: 'register' as const,
      label: 'Register User',
      icon: User,
      description: 'Add new user'
    },
    {
      id: 'attendance' as const,
      label: 'Mark Attendance',
      icon: Camera,
      description: 'Face scan'
    },
    {
      id: 'history' as const,
      label: 'View History',
      icon: Users,
      description: 'Check records'
    }
  ];

  return (
    <Card className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'outline'}
              onClick={() => onViewChange(item.id)}
              className={`h-auto p-4 flex flex-col items-center gap-2 transition-all ${
                isActive ? 'ring-2 ring-primary/20' : 'hover:bg-muted'
              }`}
            >
              <Icon className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-70">{item.description}</div>
              </div>
            </Button>
          );
        })}
      </div>
      
      {/* Clear Data Button */}
      <div className="flex justify-center">
        <Button
          variant="destructive"
          onClick={handleClearData}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Demo Data
        </Button>
      </div>
    </Card>
  );
};