import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, StopCircle } from 'lucide-react';

interface CameraControlsProps {
  isStreamActive: boolean;
  isCapturing: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCapture: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  isStreamActive,
  isCapturing,
  onStartCamera,
  onStopCamera,
  onCapture
}) => {
  return (
    <div className="flex gap-2 justify-center">
      {!isStreamActive ? (
        <Button onClick={onStartCamera} className="flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Start Camera
        </Button>
      ) : (
        <>
          <Button 
            onClick={onCapture} 
            disabled={isCapturing}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {isCapturing ? 'Processing...' : 'Capture'}
          </Button>
          <Button 
            onClick={onStopCamera} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <StopCircle className="w-4 h-4" />
            Stop Camera
          </Button>
        </>
      )}
    </div>
  );
};