import { useEffect, useRef, useState } from 'react';
import '../../styles/VideoCall.css';

const RemoteVideo = ({ 
  stream, 
  username = "Peer", 
  hasAudio = true, 
  hasVideo = true,
  className = "" 
}) => {
  const videoRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  // Connect the stream to the video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      // Check if video is actually playing
      const checkVideoPlaying = () => {
        setIsVideoPlaying(
          hasVideo && 
          videoRef.current.readyState >= 2 && 
          videoRef.current.videoWidth > 0
        );
      };
      
      videoRef.current.addEventListener('loadeddata', checkVideoPlaying);
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadeddata', checkVideoPlaying);
        }
      };
    }
  }, [stream, hasVideo]);
  
  // Monitor audio levels if audio is enabled
  useEffect(() => {
    if (!stream || !hasAudio) {
      setAudioLevel(0);
      return;
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    analyser.fftSize = 256;
    microphone.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const getAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const avg = sum / dataArray.length;
      const level = Math.min(100, Math.round((avg / 255) * 100));
      return level;
    };

    const intervalId = setInterval(() => {
      const level = getAudioLevel();
      setAudioLevel(level);
    }, 100);

    return () => {
      clearInterval(intervalId);
      microphone.disconnect();
      audioContext.close();
    };
  }, [stream, hasAudio]);

  const borderClass = audioLevel > 10
    ? `border-2 shadow-custom-lg ${audioLevel > 40 ? 'border-theme-primary animate-pulse-dark-red' : 'border-dark-red-600'}`
    : 'border border-gray-800';

  if (!hasVideo) {
    // Render nothing if video is off
    return <div className={`relative w-full h-full overflow-hidden rounded-lg bg-video-bg ${borderClass} transition-all duration-300 ${className}`}></div>;
  }

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-lg bg-video-bg ${borderClass} transition-all duration-300 ${className}`}>
      {/* Main video display */}
      {hasVideo && isVideoPlaying ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        />
      ) : null}
      {/* Status indicators: only render the label, not the mute icon, if audio is on */}
      <div className="absolute bottom-2 left-2 flex items-center space-x-2">
        <div className="bg-theme-secondary bg-opacity-70 backdrop-blur-sm py-1 px-2 rounded-md">
          <p className="text-xs text-theme-accent font-medium">{username}</p>
        </div>
      </div>
    </div>
  );
};

export default RemoteVideo;
