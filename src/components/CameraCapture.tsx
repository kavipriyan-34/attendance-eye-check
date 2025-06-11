import React, { useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  isCapturing?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, isCapturing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [error, setError] = useState<string>('');

  const startCamera = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreamActive(false);
    }
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      
      onCapture(base64Data);
      stopCamera();
    }
  }, [onCapture, stopCamera]);

  return (
    <Card className="p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Camera Capture</h3>
        <p className="text-muted-foreground text-sm">
          Position your face in the center and click capture
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {!isStreamActive ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Camera not active</p>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-2 justify-center">
        {!isStreamActive ? (
          <Button onClick={startCamera} className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Start Camera
          </Button>
        ) : (
          <>
            <Button 
              onClick={captureImage} 
              disabled={isCapturing}
              className="flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {isCapturing ? 'Processing...' : 'Capture'}
            </Button>
            <Button variant="outline" onClick={stopCamera}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};