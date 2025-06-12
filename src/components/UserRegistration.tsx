import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CameraCapture } from './CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

export const UserRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    employee_id: ''
  });
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData);
    toast({
      title: "Image Captured",
      description: "Face image captured successfully!",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.employee_id || !capturedImage) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields and capture your face image.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          employee_id: formData.employee_id,
          image: capturedImage
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Registration Successful",
          description: `Welcome ${formData.name}! You can now mark attendance.`,
        });
        
        // Reset form
        setFormData({ name: '', employee_id: '' });
        setCapturedImage('');
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : 'An error occurred during registration.',
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
            <Users className="w-5 h-5" />
            Register New User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  name="employee_id"
                  type="text"
                  placeholder="Enter your employee ID"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Face Capture</Label>
              <CameraCapture 
                onCapture={handleImageCapture}
                isCapturing={isCapturing}
              />
              {capturedImage && (
                <div className="text-center">
                  <p className="text-sm text-accent font-medium">✓ Face image captured successfully</p>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !capturedImage}
            >
              {isSubmitting ? 'Registering...' : 'Register User'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};