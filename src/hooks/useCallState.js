import { useCallback, useEffect, useRef, useState } from 'react';
import { SIGNALING_TYPES } from '../lib/constants';
import useMediaDevices from './useMediaDevices';
import useSupabaseRealtime from './useSupabaseRealtime';
import useWebRTC from './useWebRTC';

/**
 * Main hook that combines all WebRTC functionality to manage a complete video call
 */
export default function useCallState() {
  const [roomId, setRoomId] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const roomIdRef = useRef(null);
  const hasEndedCallRef = useRef(false);
  const mediaInitializedRef = useRef(false);

  // Room state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Get access to media devices
  const {
    localStream,
    hasAudio,
    hasVideo,
    startLocalStream,
    stopLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    error: mediaError,
  } = useMediaDevices();

  // Set up signaling
  const {
    error: signalingError,
    sendSignal,
    listenForSignals,
    createRoom,
    joinRoom,
  } = useSupabaseRealtime(roomId);

  // Set up WebRTC 
  const {
    connectionState,
    remoteStream,
    error: webrtcError,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    closeConnection,
  } = useWebRTC(localStream, sendSignal);

  // Aggregate error from various sources
  const error = mediaError || signalingError || webrtcError;

  // Define endCall function before it's used in useEffect
  const endCall = useCallback(() => {
    console.log('Ending call, current state:', { roomId, connectionState, hasEnded: hasEndedCallRef.current });
    
    // Prevent sending multiple HANGUP signals
    if (hasEndedCallRef.current) {
      console.log('Call already ended, skipping HANGUP signal');
      return;
    }
    
    // Mark call as ended
    hasEndedCallRef.current = true;
    
    // Prevent infinite loop - only send HANGUP if we have an active connection
    // and haven't already closed it
    if (roomId && connectionState !== 'disconnected') {
      console.log('Sending HANGUP signal');
      sendSignal({ type: SIGNALING_TYPES.HANGUP })
        .catch(err => console.error('Error sending hangup signal:', err));
    }
    
    closeConnection();
    setRoomId(null);
    roomIdRef.current = null; // Also clear the ref to prevent stale values
    setIsScreenSharing(false);
    setCallStatus('idle');
    mediaInitializedRef.current = false;
  }, [roomId, connectionState, sendSignal, closeConnection]);

  // Effect to set up signal listeners when room is joined
  useEffect(() => {
    if (!roomId) return;

    console.log('Setting up signal listener effect for room:', roomId);
    hasEndedCallRef.current = false; // Reset the ended state when joining a new room
    
    const cleanup = listenForSignals((signal) => {
      try {
        console.log('Received signal:', signal.type);
        switch (signal.type) {
          case SIGNALING_TYPES.OFFER:
            handleOffer(signal.sdp);
            break;
          case SIGNALING_TYPES.ANSWER:
            handleAnswer(signal.sdp);
            break; 
          case SIGNALING_TYPES.ICE_CANDIDATE:
            handleIceCandidate(signal.candidate);
            break;
          case SIGNALING_TYPES.HANGUP:
            // Only process HANGUP if we're still in a call
            console.log('Received HANGUP signal, current state:', connectionState);
            if (connectionState !== 'disconnected' && !hasEndedCallRef.current) {
              console.log('Processing HANGUP signal');
              hasEndedCallRef.current = true; // Mark as ended to prevent sending our own HANGUP
              endCall();
            }
            break;
          default:
            console.warn('Unknown signal type:', signal.type);
        }
      } catch (err) {
        console.error('Error processing signal:', err);
      }
    });

    return cleanup;
  }, [roomId, connectionState, handleOffer, handleAnswer, handleIceCandidate, endCall, listenForSignals]);

  // Initialize media before starting a call
  const initializeMedia = useCallback(async () => {
    try {
      console.log('Initializing media devices');
      
      if (mediaInitializedRef.current && localStream) {
        console.log('Media already initialized, using existing stream');
        return localStream;
      }
      
      const stream = await startLocalStream();
      console.log('Media devices initialized successfully');
      mediaInitializedRef.current = true;
      return stream;
    } catch (err) {
      console.error('Failed to initialize media:', err);
      throw err;
    }
  }, [startLocalStream, localStream]);

  // Start a new call (create a room)
  const startCall = useCallback(async () => {
    try {
      console.log('Starting new call');
      // Reset the ended call flag
      hasEndedCallRef.current = false;
      
      // Step 1: Initialize media first
      console.log('Step 1: Initializing media');
      const stream = await initializeMedia();
      if (!stream) {
        throw new Error('Failed to initialize media stream');
      }
      
      // Step 2: Create a room and get room ID
      console.log('Step 2: Creating room');
      const newRoomId = await createRoom();
      console.log('Room created with ID:', newRoomId);
      
      // Step 3: Update state with the room ID
      console.log('Step 3: Updating room ID state');
      setRoomId(newRoomId);
      
      // Step 4: Update the ref directly to ensure immediate access
      console.log('Step 4: Updating room ID ref');
      roomIdRef.current = newRoomId;
      
      // Step 5: Wait a moment to ensure all state updates have been processed
      console.log('Step 5: Waiting for state updates');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 6: Now create the offer with the room ID available
      console.log('Step 6: Creating WebRTC offer');
      await createOffer();
      console.log('Offer created successfully');
      
      // Update local state
      console.log('Setting call status to connecting');
      setCallStatus('connecting');
      
      return newRoomId;
    } catch (err) {
      console.error('Failed to start call:', err);
      throw err;
    }
  }, [initializeMedia, createRoom, createOffer]);

  // Join an existing call
  const joinCall = useCallback(async (callRoomId) => {
    try {
      console.log('Joining call with room ID:', callRoomId);
      // Reset the ended call flag
      hasEndedCallRef.current = false;
      
      // Step 1: Initialize media
      console.log('Step 1: Initializing media');
      const stream = await initializeMedia();
      if (!stream) {
        throw new Error('Failed to initialize media stream');
      }
      
      // Step 2: Validate and join the room
      console.log('Step 2: Validating and joining room');
      const validatedRoomId = await joinRoom(callRoomId);
      console.log('Room validated with ID:', validatedRoomId);
      
      // Step 3: Update our state with the room ID
      console.log('Step 3: Updating room ID state');
      setRoomId(validatedRoomId);
      
      // Step 4: Update the ref directly to ensure immediate access
      console.log('Step 4: Updating room ID ref');
      roomIdRef.current = validatedRoomId;
      
      // Step 5: Wait a moment to ensure all state updates have been processed
      console.log('Step 5: Waiting for state updates');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update call status
      console.log('Setting call status to connecting');
      setCallStatus('connecting');
      
      return validatedRoomId;
    } catch (err) {
      console.error('Failed to join call:', err);
      throw err;
    }
  }, [initializeMedia, joinRoom]);

  // Toggle screen sharing
  const toggleScreenSharing = useCallback(async () => {
    try {
      if (isScreenSharing) {
        await startLocalStream();
      } else {
        await startScreenShare();
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (err) {
      console.error('Error toggling screen share:', err);
    }
  }, [isScreenSharing, startLocalStream, startScreenShare]);

  // Clean up when component unmounts
  useEffect(() => {
    // Flag to prevent operations after unmounting
    const isUnmounting = { current: false };
    
    return () => {
      console.log('Component unmounting, cleaning up call state');
      isUnmounting.current = true;
      
      // Perform cleanup operations
      if (roomId) {
        // Don't send HANGUP signal on unmount - this avoids triggering 
        // unnecessary events in a component that's going away
        closeConnection();
        stopLocalStream();
        
        // Clear all state to prevent any lingering effects
        setRoomId(null);
        roomIdRef.current = null;
        setIsScreenSharing(false);
        mediaInitializedRef.current = false;
      }
    };
  }, [roomId, closeConnection, stopLocalStream]);

  // Update call status based on connection state
  useEffect(() => {
    console.log('Connection state changed to:', connectionState);
    if (connectionState === 'connected') {
      setCallStatus('connected');
    } else if (connectionState === 'disconnected') {
      setCallStatus('idle');
    } else if (connectionState === 'error') {
      setCallStatus('error');
    }
  }, [connectionState]);

  return {
    // Media state
    localStream,
    remoteStream,
    hasAudio,
    hasVideo,
    isScreenSharing,

    // Call state
    roomId,
    connectionState,
    callStatus,
    error,

    // Actions
    startCall,
    joinCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenSharing,
  };
}
