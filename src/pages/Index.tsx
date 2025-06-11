import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { UserRegistration } from '@/components/UserRegistration';
import { AttendanceMarking } from '@/components/AttendanceMarking';
import { AttendanceHistory } from '@/components/AttendanceHistory';
import { Camera } from 'lucide-react';

const Index = () => {
  const [activeView, setActiveView] = useState<'register' | 'attendance' | 'history'>('attendance');

  const renderActiveView = () => {
    switch (activeView) {
      case 'register':
        return <UserRegistration />;
      case 'attendance':
        return <AttendanceMarking />;
      case 'history':
        return <AttendanceHistory />;
      default:
        return <AttendanceMarking />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Camera className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                FaceAttend
              </h1>
              <p className="text-muted-foreground">Smart Attendance System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Navigation */}
        <Navigation activeView={activeView} onViewChange={setActiveView} />
        
        {/* Active View */}
        <div className="animate-fade-in">
          {renderActiveView()}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by AI Face Recognition Technology
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
