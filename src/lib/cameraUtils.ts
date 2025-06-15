// Camera utility functions and constraints

export const getCameraConstraints = (): MediaStreamConstraints[] => [
  { video: { width: 640, height: 480 } },
  { video: { facingMode: 'user' } },
  { video: true }
];

export const getCameraWithTimeout = (
  constraints: MediaStreamConstraints, 
  timeout = 8000
): Promise<MediaStream> => {
  return Promise.race([
    navigator.mediaDevices.getUserMedia(constraints),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Camera access timeout')), timeout)
    )
  ]);
};

export const getUserFriendlyErrorMessage = (errorMsg: string): string => {
  if (errorMsg.includes('timeout')) {
    return 'Camera took too long to start. Please try again or check if another app is using the camera.';
  }
  if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
    return 'Camera permission denied. Please allow camera access and try again.';
  }
  if (errorMsg.includes('NotFoundError') || errorMsg.includes('DevicesNotFoundError')) {
    return 'No camera found. Please connect a camera and try again.';
  }
  if (errorMsg.includes('NotReadableError') || errorMsg.includes('TrackStartError')) {
    return 'Camera is being used by another application. Please close other apps and try again.';
  }
  return errorMsg;
};

export const checkVideoReadiness = (video: HTMLVideoElement): { ready: boolean; error?: string } => {
  if (video.readyState !== 4) {
    return { ready: false, error: 'Video is still loading. Please wait and try again.' };
  }
  
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    return { ready: false, error: 'Video stream not ready. Please try again.' };
  }
  
  return { ready: true };
};