import React from 'react';
import { Camera } from 'lucide-react';

interface CameraDisplayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreamActive: boolean;
  debugInfo: string;
  onVideoClick: () => void;
}

export const CameraDisplay: React.FC<CameraDisplayProps> = ({
  videoRef,
  isStreamActive,
  debugInfo,
  onVideoClick
}) => {
  return (
    <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover cursor-pointer ${isStreamActive ? 'block' : 'hidden'}`}
        onClick={onVideoClick}
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
  );
};