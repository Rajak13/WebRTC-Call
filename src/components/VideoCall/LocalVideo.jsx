import { useEffect, useRef } from 'react';
import '../../styles/VideoCall.css';
import LoadingSpinner from '../UI/LoadingSpinner';

const LocalVideo = ({ 
  stream, 
  isMuted = false, 
  isVideoOff = false,
  isLoading = false,
  className = ""
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream && !isVideoOff) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOff]);

  if (isLoading) {
    return (
      <div className={`relative w-full h-full overflow-hidden rounded-lg bg-video-bg ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (isVideoOff) {
    // Render nothing if video is off
    return <div className={`relative w-full h-full overflow-hidden rounded-lg bg-video-bg ${className}`}></div>;
  }

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-lg bg-video-bg ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted={isMuted}
      />
      {/* Status indicator: only render the label, not the mute icon, if not muted */}
      <div className="absolute bottom-2 left-2 flex items-center space-x-2">
        <div className="bg-theme-secondary bg-opacity-70 backdrop-blur-sm py-1 px-2 rounded-md">
          <p className="text-xs text-theme-accent font-medium">You</p>
        </div>
      </div>
    </div>
  );
};

export default LocalVideo;
