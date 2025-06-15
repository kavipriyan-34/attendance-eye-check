import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera } from 'lucide-react';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { CameraDisplay } from './CameraDisplay';
import { CameraControls } from './CameraControls';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  isCapturing: boolean;
  title?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  isCapturing,
  title = "Camera Capture"
}) => {
  const {
    videoRef,
    canvasRef,
    isStreamActive,
    debugInfo,
    startCamera,
    stopCamera,
    captureImage,
    handleVideoClick
  } = useCameraCapture();

  const handleCapture = () => {
    const imageData = captureImage();
    if (imageData) {
      onCapture(imageData);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {debugInfo && debugInfo.includes('Error') && (
          <Alert variant="destructive">
            <AlertDescription className="space-y-2">
              <p><strong>Camera Issue:</strong> {debugInfo.replace('Error: ', '')}</p>
              <div className="text-xs space-y-1">
                <p><strong>Try these solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Make sure no other apps are using your camera</li>
                  <li>Check camera permissions in your browser settings</li>
                  <li>Try refreshing the page</li>
                  <li>Ensure your camera is properly connected</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {debugInfo && !debugInfo.includes('Error') && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Status: {debugInfo}</p>
          </div>
        )}
        
        <CameraDisplay
          videoRef={videoRef}
          isStreamActive={isStreamActive}
          debugInfo={debugInfo}
          onVideoClick={handleVideoClick}
        />
        
        <canvas ref={canvasRef} className="hidden" />
        
        <CameraControls
          isStreamActive={isStreamActive}
          isCapturing={isCapturing}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          onCapture={handleCapture}
        />
      </CardContent>
    </Card>
  );
};