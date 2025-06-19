import { useCallback, useEffect, useRef, useState } from 'react';
import { MEDIA_CONSTRAINTS } from '../lib/constants';
import { MediaError, handleWebRTCError } from '../utils/errorHandling';

/**
 * Hook to handle access to media devices (camera and microphone)
 * Provides functions to start, stop, and toggle media streams
 */
export const useMediaDevices = () => {
  const [localStream, setLocalStream] = useState(null);
  const [hasAudio, setHasAudio] = useState(true);
  const [hasVideo, setHasVideo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const streamInitializedRef = useRef(false);

  // Get access to user's camera and microphone
  const startLocalStream = useCallback(async (customConstraints = {}) => {
    // If we already have a stream, return it
    if (localStream && streamInitializedRef.current) {
      console.log('Using existing local stream');
      return localStream;
    }

    console.log('Starting new local stream');
    setIsLoading(true);
    setError(null);

    try {
      // Merge custom constraints with default ones
      const constraints = {
        video: {
          ...MEDIA_CONSTRAINTS.video,
          ...customConstraints.video,
        },
        audio: {
          ...MEDIA_CONSTRAINTS.audio,
          ...customConstraints.audio,
        },
      };

      console.log('Requesting media access with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Media access granted, tracks:', stream.getTracks().length);
      
      setLocalStream(stream);
      streamInitializedRef.current = true;
      setHasAudio(true);
      setHasVideo(true);
      return stream;
    } catch (err) {
      console.error('Error getting user media:', err);
      const errorInfo = handleWebRTCError(err, 'getUserMedia');
      setError(errorInfo.userMessage);
      throw new MediaError(errorInfo.userMessage, errorInfo.errorCode);
    } finally {
      setIsLoading(false);
    }
  }, [localStream]);

  // Stop all tracks in the stream and clear the state
  const stopLocalStream = useCallback(() => {
    if (localStream) {
      console.log('Stopping local stream tracks');
      localStream.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track`);
        track.stop();
      });
      setLocalStream(null);
      streamInitializedRef.current = false;
      setHasAudio(false);
      setHasVideo(false);
    }
  }, [localStream]);

  // Toggle audio on/off
  const toggleAudio = useCallback(() => {
    if (!localStream) {
      console.warn('Cannot toggle audio: No local stream available');
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn('No audio tracks found in local stream');
      return;
    }
    
    const enabled = !audioTracks[0]?.enabled;
    console.log(`Toggling audio: ${enabled ? 'on' : 'off'}`);

    audioTracks.forEach(track => {
      track.enabled = enabled;
    });

    setHasAudio(enabled);
  }, [localStream]);

  // Toggle video on/off
  const toggleVideo = useCallback(() => {
    if (!localStream) {
      console.warn('Cannot toggle video: No local stream available');
      return;
    }

    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.warn('No video tracks found in local stream');
      return;
    }
    
    const enabled = !videoTracks[0]?.enabled;
    console.log(`Toggling video: ${enabled ? 'on' : 'off'}`);

    videoTracks.forEach(track => {
      track.enabled = enabled;
    });

    setHasVideo(enabled);
  }, [localStream]);

  // Share screen instead of camera
  const startScreenShare = useCallback(async () => {
    try {
      console.log('Starting screen share');
      
      // Stop camera stream if it's active
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          console.log('Stopping video track before screen share');
          track.stop();
        });
      }

      // Get screen sharing stream
      console.log('Requesting screen sharing access');
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always"
        },
        audio: false
      });
      console.log('Screen sharing access granted');

      // Keep audio tracks from original stream if they exist
      const tracks = [...screenStream.getTracks()];
      
      if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
          console.log('Adding audio tracks to screen share stream');
          tracks.push(...audioTracks);
        }
      }

      // Create a new stream with both screen video and audio
      const combinedStream = new MediaStream(tracks);
      console.log(`Combined stream created with ${tracks.length} tracks`);
      
      setLocalStream(combinedStream);
      streamInitializedRef.current = true;
      setHasVideo(true);
      
      // Add event listener for when user stops sharing screen
      screenStream.getVideoTracks()[0].onended = () => {
        // Automatically switch back to camera when screen sharing is stopped
        console.log('Screen sharing ended by user, switching back to camera');
        startLocalStream();
      };
      
      return combinedStream;
    } catch (err) {
      console.error('Error starting screen share:', err);
      const errorInfo = handleWebRTCError(err, 'getDisplayMedia');
      setError(errorInfo.userMessage);
      throw new MediaError(errorInfo.userMessage, errorInfo.errorCode);
    }
  }, [localStream, startLocalStream]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      console.log('useMediaDevices unmounting, cleaning up');
      stopLocalStream();
    };
  }, [stopLocalStream]);

  return {
    localStream,
    startLocalStream,
    stopLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    hasAudio,
    hasVideo,
    isLoading,
    error,
  };
};

export default useMediaDevices;
