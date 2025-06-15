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
        throw new Error('Camera not supported by this browser');
      }
      
      setDebugInfo('Requesting camera access...');
      
      // Enhanced camera access with timeout and better error handling
      const getCameraWithTimeout = (constraints: MediaStreamConstraints, timeout = 10000) => {
        return Promise.race([
          navigator.mediaDevices.getUserMedia(constraints),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Camera access timeout')), timeout)
          )
        ]);
      };

      // Simplified constraints that work more reliably
      const constraints = [
        { video: { width: 640, height: 480 } },
        { video: { facingMode: 'user' } },
        { video: true }
      ];
      
      let mediaStream = null;
      let lastError = null;
      
      for (let i = 0; i < constraints.length; i++) {
        try {
          console.log(`Trying camera constraint ${i + 1}:`, constraints[i]);
          setDebugInfo(`Trying camera method ${i + 1}/3...`);
          
          mediaStream = await getCameraWithTimeout(constraints[i], 8000);
          
          if (mediaStream && mediaStream.getVideoTracks().length > 0) {
            console.log('Camera access successful with constraint', i + 1);
            setDebugInfo('Camera connected successfully!');
            break;
          }
        } catch (error) {
          console.log(`Constraint ${i + 1} failed:`, error);
          lastError = error;
          mediaStream = null;
        }
      }
      
      if (!mediaStream) {
        const errorMsg = lastError instanceof Error ? lastError.message : 'Unknown error';
        throw new Error(`Camera access failed: ${errorMsg}`);
      }
      
      // Verify video element is ready
      if (!videoRef.current) {
        throw new Error('Video element not ready');
      }
      
      // Setup video stream
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setIsStreamActive(true);
      
      // Handle video playback
      try {
        await videoRef.current.play();
        setDebugInfo('Camera active and ready');
        
        toast({
          title: "Camera Ready",
          description: "Camera is now active and ready to capture images."
        });
      } catch (playError) {
        setDebugInfo('Camera ready - click video to start');
      }
      
    } catch (error) {
      console.error('Camera error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown camera error';
      
      // Provide user-friendly error messages
      let userFriendlyMessage = errorMsg;
      if (errorMsg.includes('timeout')) {
        userFriendlyMessage = 'Camera took too long to start. Please try again or check if another app is using the camera.';
      } else if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        userFriendlyMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (errorMsg.includes('NotFoundError') || errorMsg.includes('DevicesNotFoundError')) {
        userFriendlyMessage = 'No camera found. Please connect a camera and try again.';
      } else if (errorMsg.includes('NotReadableError') || errorMsg.includes('TrackStartError')) {
        userFriendlyMessage = 'Camera is being used by another application. Please close other apps and try again.';
      }
      
      setDebugInfo(`Error: ${userFriendlyMessage}`);
      
      toast({
        title: "Camera Error",
        description: userFriendlyMessage,
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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover cursor-pointer ${isStreamActive ? 'block' : 'hidden'}`}
            onClick={async () => {
              if (videoRef.current) {
                try {
                  await videoRef.current.play();
                  console.log('Video playing after click');
                  setDebugInfo('Camera active - video playing');
                } catch (err) {
                  console.error('Error playing video after click:', err);
                }
              }
            }}
          />
          {!isStreamActive && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
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