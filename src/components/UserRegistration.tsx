import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CameraCapture } from './CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';

export const UserRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    department: ''
  });
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.employee_id || !capturedImage) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields and capture an image.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Mock successful registration for demo purposes
      // In production, replace this with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Simulate successful response
      toast({
        title: "Registration Successful",
        description: `User ${formData.name} registered successfully! (Demo mode - no backend connected)`
      });
      
      // Reset form
      setFormData({ name: '', employee_id: '', department: '' });
      setCapturedImage('');
      
      // Log the captured data for debugging
      console.log('User registration data:', {
        ...formData,
        imageSize: capturedImage.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Register New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  name="employee_id"
                  type="text"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  placeholder="Enter employee ID"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Enter department"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !capturedImage}
              className="w-full"
            >
              {isSubmitting ? 'Registering...' : 'Register User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <CameraCapture
        onCapture={handleImageCapture}
        isCapturing={isSubmitting}
        title="Capture Face for Registration"
      />

      {capturedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Captured Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={capturedImage}
              alt="Captured face"
              className="w-full max-w-md mx-auto rounded-lg"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};