import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { toast } = useToast();

  const startCamera = async () => {
    console.log('Starting camera...');
    setDebugInfo('Starting camera...');
    
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }
      
      console.log('Requesting camera access...');
      setDebugInfo('Requesting camera access...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      console.log('Camera access granted, stream received:', mediaStream);
      setDebugInfo('Camera access granted, setting up video...');
      
      if (videoRef.current) {
        console.log('Setting video srcObject...');
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsStreamActive(true);
        setDebugInfo('Video stream active');
        
        // Force play the video
        try {
          await videoRef.current.play();
          console.log('Video playing successfully');
          setDebugInfo('Camera ready - video playing');
        } catch (playError) {
          console.log('Auto-play failed, but stream is set:', playError);
          setDebugInfo('Stream set - may need user interaction to play');
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setDebugInfo('Camera error: ' + (error as Error).message);
      toast({
        title: "Camera Error",
        description: `Unable to access camera: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreamActive(false);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Capture Error",
        description: "Camera not ready. Please try again.",
        variant: "destructive"
      });
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    // Check if video is ready
    if (video.readyState !== 4) {
      toast({
        title: "Capture Error",
        description: "Video is still loading. Please wait and try again.",
        variant: "destructive"
      });
      return;
    }

    // Check if video has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast({
        title: "Capture Error",
        description: "Video stream not ready. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    if (context) {
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        console.log('Image captured, data length:', imageData.length);
        
        onCapture(imageData);
        
        toast({
          title: "Image Captured",
          description: "Face image captured successfully!"
        });
      } catch (error) {
        console.error('Error capturing image:', error);
        toast({
          title: "Capture Error",
          description: "Failed to capture image. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Capture Error",
        description: "Unable to get canvas context.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {debugInfo && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Debug: {debugInfo}</p>
          </div>
        )}
        
        <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
          {isStreamActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Camera not active</p>
                {debugInfo && <p className="text-xs text-muted-foreground">{debugInfo}</p>}
              </div>
            </div>
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
              <Button 
                onClick={stopCamera} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <StopCircle className="w-4 h-4" />
                Stop Camera
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};