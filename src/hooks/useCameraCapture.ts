import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getCameraConstraints, 
  getCameraWithTimeout, 
  getUserFriendlyErrorMessage,
  checkVideoReadiness
} from '@/lib/cameraUtils';

export const useCameraCapture = () => {
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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }
      
      setDebugInfo('Requesting camera access...');
      
      const constraints = getCameraConstraints();
      let mediaStream = null;
      let lastError = null;
      
      for (let i = 0; i < constraints.length; i++) {
        try {
          console.log(`Trying camera constraint ${i + 1}:`, constraints[i]);
          setDebugInfo(`Trying camera method ${i + 1}/3...`);
          
          mediaStream = await getCameraWithTimeout(constraints[i]);
          
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
      
      if (!videoRef.current) {
        throw new Error('Video element not ready');
      }
      
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setIsStreamActive(true);
      
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
      const userFriendlyMessage = getUserFriendlyErrorMessage(errorMsg);
      
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
      setDebugInfo('');
    }
  };

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Capture Error",
        description: "Camera not ready. Please try again.",
        variant: "destructive"
      });
      return null;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    const videoCheck = checkVideoReadiness(video);
    if (!videoCheck.ready) {
      toast({
        title: "Capture Error",
        description: videoCheck.error,
        variant: "destructive"
      });
      return null;
    }
    
    if (!context) {
      toast({
        title: "Capture Error",
        description: "Unable to get canvas context.",
        variant: "destructive"
      });
      return null;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Image captured, data length:', imageData.length);
      
      toast({
        title: "Image Captured",
        description: "Face image captured successfully!"
      });
      
      return imageData;
    } catch (error) {
      console.error('Error capturing image:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture image. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleVideoClick = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        console.log('Video playing after click');
        setDebugInfo('Camera active - video playing');
      } catch (err) {
        console.error('Error playing video after click:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isStreamActive,
    debugInfo,
    startCamera,
    stopCamera,
    captureImage,
    handleVideoClick
  };
};