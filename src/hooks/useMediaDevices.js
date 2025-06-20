import { useCallback, useEffect, useRef, useState } from 'react';
import { MEDIA_CONSTRAINTS } from '../lib/constants';
import { MediaError, handleWebRTCError } from '../utils/errorHandling';

/**
 * Hook to handle access to media devices (camera and microphone)
 * Provides functions to start, stop, and toggle media streams
 */
export const useMediaDevices = () => {
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const [hasAudio, setHasAudio] = useState(true);
  const [hasVideo, setHasVideo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const streamInitializedRef = useRef(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Get access to user's camera and microphone
  const startLocalStream = useCallback(async (customConstraints = {}) => {
    // If we already have a stream, return it
    if (localStreamRef.current && streamInitializedRef.current) {
      console.log('Using existing local stream');
      return localStreamRef.current;
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
      
      // Try to get user media with retry logic for device in use errors
      let stream;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break; // Success, exit retry loop
        } catch (err) {
          retryCount++;
          console.log(`Media access attempt ${retryCount} failed:`, err.name);
          
          if (err.name === 'NotReadableError' && retryCount < maxRetries) {
            // Device in use, wait a bit and retry
            console.log('Device in use, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          } else {
            // Either max retries reached or different error
            throw err;
          }
        }
      }
      
      console.log('Media access granted, tracks:', stream.getTracks().length);
      
      localStreamRef.current = stream;
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
  }, []);

  // Stop all tracks in the stream and clear the state
  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      console.log('Stopping local stream tracks');
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track`);
        track.stop();
      });
      localStreamRef.current = null;
      setLocalStream(null);
      streamInitializedRef.current = false;
      setHasAudio(false);
      setHasVideo(false);
    }
  }, []);

  // Toggle audio on/off
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) {
      console.warn('Cannot toggle audio: No local stream available');
      return;
    }

    const audioTracks = localStreamRef.current.getAudioTracks();
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
  }, []);

  // Toggle video on/off
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) {
      console.warn('Cannot toggle video: No local stream available');
      return;
    }

    const videoTracks = localStreamRef.current.getVideoTracks();
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
  }, []);

  // Share screen instead of camera
  const startScreenShare = useCallback(async () => {
    try {
      console.log('Starting screen share');
      
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
      
      if (localStreamRef.current) {
        const audioTracks = localStreamRef.current.getAudioTracks();
        if (audioTracks.length > 0) {
          console.log('Adding audio tracks to screen share stream');
          tracks.push(...audioTracks);
        }
      }

      // Create a new stream with both screen video and audio
      const combinedStream = new MediaStream(tracks);
      console.log(`Combined stream created with ${tracks.length} tracks`);
      
      // Update both ref and state
      localStreamRef.current = combinedStream;
      setLocalStream(combinedStream);
      streamInitializedRef.current = true;
      setHasVideo(true);
      setIsScreenSharing(true);
      
      // Add event listener for when user stops sharing screen
      screenStream.getVideoTracks()[0].onended = () => {
        // Screen sharing ended by user, but we'll handle switching back in toggleScreenSharing
        console.log('Screen sharing ended by user');
        setIsScreenSharing(false);
      };
      
      return combinedStream;
    } catch (err) {
      console.error('Error starting screen share:', err);
      const errorInfo = handleWebRTCError(err, 'getDisplayMedia');
      setError(errorInfo.userMessage);
      throw new MediaError(errorInfo.userMessage, errorInfo.errorCode);
    }
  }, []);

  // Force stop all tracks (for cleanup)
  const forceStopAllTracks = useCallback(() => {
    console.log('Force stopping all media tracks');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`Force stopping ${track.kind} track`);
        track.stop();
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);
    streamInitializedRef.current = false;
    setHasAudio(false);
    setHasVideo(false);
    setIsScreenSharing(false);
  }, []);

  // Toggle screen sharing state
  const toggleScreenSharingState = useCallback(() => {
    setIsScreenSharing(!isScreenSharing);
  }, [isScreenSharing]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      console.log('useMediaDevices unmounting, cleaning up');
      // Always stop the stream to prevent "device in use" errors
      if (localStreamRef.current) {
        console.log('Stopping all media tracks during cleanup');
        localStreamRef.current.getTracks().forEach(track => {
          console.log(`Stopping ${track.kind} track during cleanup`);
          track.stop();
        });
        localStreamRef.current = null;
      }
      streamInitializedRef.current = false;
    };
  }, []);

  return {
    localStream,
    startLocalStream,
    stopLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    toggleScreenSharingState,
    hasAudio,
    hasVideo,
    isScreenSharing,
    isLoading,
    error,
    forceStopAllTracks,
  };
};

export default useMediaDevices;
