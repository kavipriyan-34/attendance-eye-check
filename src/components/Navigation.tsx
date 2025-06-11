import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Users, User } from 'lucide-react';

interface NavigationProps {
  activeView: 'register' | 'attendance' | 'history';
  onViewChange: (view: 'register' | 'attendance' | 'history') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange }) => {
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
    <Card className="p-4">
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
    </Card>
  );
};