import { useCallback, useEffect, useRef, useState } from 'react';
import { CALL_STATES, WEBRTC_CONFIG } from '../lib/constants';
import { ConnectionError, handleWebRTCError } from '../utils/errorHandling';

/**
 * Custom hook to manage WebRTC peer connection
 * This handles the actual peer-to-peer connection between users
 */
const useWebRTC = (onSignalNeeded) => {
  const [connectionState, setConnectionState] = useState(CALL_STATES.DISCONNECTED);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState(null);
  
  // Use refs to store streams and connections to prevent recreation
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const connectionTimeoutRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);

  // Function to update the local stream ref
  const updateLocalStream = useCallback((stream) => {
    localStreamRef.current = stream;
  }, []);

  // Create a new RTCPeerConnection
  const createPeerConnection = useCallback(() => {
    console.log('Creating new RTCPeerConnection');
    
    const peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);
    peerConnectionRef.current = peerConnection;
    
    // Set up event handlers
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate generated:', event.candidate.candidate);
        if (typeof onSignalNeeded === 'function') {
          onSignalNeeded({
            type: 'ice-candidate',
            candidate: event.candidate,
          }).catch(err => console.error('Error sending ICE candidate:', err));
        }
      }
    };
    
    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      setRemoteStream(event.streams[0]);
    };
    
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state changed to:', peerConnection.connectionState);
      setConnectionState(peerConnection.connectionState);
    };
    
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state changed to:', peerConnection.iceConnectionState);
    };
    
    peerConnection.onsignalingstatechange = () => {
      console.log('Signaling state changed to:', peerConnection.signalingState);
    };
    
    peerConnection.onicegatheringstatechange = () => {
      console.log('ICE gathering state changed to:', peerConnection.iceGatheringState);
    };
    
    return peerConnection;
  }, [onSignalNeeded]);
  
  // Add local tracks to the peer connection
  const addLocalTracks = useCallback((peerConnection) => {
    const stream = localStreamRef.current;
    if (!stream) {
      console.warn('No local stream available for adding tracks');
      return;
    }
    
    try {
      console.log('Adding local tracks to peer connection');
      const tracks = stream.getTracks();
      console.log(`Adding ${tracks.length} tracks to peer connection`);
      
      tracks.forEach(track => {
        peerConnection.addTrack(track, stream);
        console.log(`Added ${track.kind} track to peer connection`);
      });
    } catch (err) {
      const errorInfo = handleWebRTCError(err, 'addLocalTracks');
      setError(errorInfo.userMessage);
    }
  }, []);
  
  // Replace local tracks (for screen sharing)
  const replaceLocalTracks = useCallback((newStream) => {
    if (!peerConnectionRef.current) {
      console.warn('No peer connection available for replacing tracks');
      return;
    }
    
    try {
      console.log('Replacing local tracks in peer connection');
      
      // Get all senders currently in the peer connection
      const senders = peerConnectionRef.current.getSenders();
      
      // Replace video tracks and keep audio tracks
      newStream.getTracks().forEach(newTrack => {
        const sender = senders.find(s => s.track && s.track.kind === newTrack.kind);
        
        if (sender) {
          // Replace existing track
          sender.replaceTrack(newTrack);
          console.log(`Replaced ${newTrack.kind} track in peer connection`);
        } else {
          // Add new track if no sender exists for this kind
          peerConnectionRef.current.addTrack(newTrack, newStream);
          console.log(`Added new ${newTrack.kind} track to peer connection`);
        }
      });
    } catch (err) {
      const errorInfo = handleWebRTCError(err, 'replaceLocalTracks');
      setError(errorInfo.userMessage);
    }
  }, []);
  
  // Create an offer to initiate the connection
  const createOffer = useCallback(async () => {
    console.log('Creating offer to initiate connection');
    
    // Wait for the local stream to be available
    if (!localStreamRef.current) {
      console.warn('Local stream not available yet, waiting...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!localStreamRef.current) {
        console.error('Local stream still not available after waiting');
        throw new Error('Local stream not available for creating offer');
      }
    }
    
    if (!peerConnectionRef.current) {
      console.log('No peer connection exists, creating one');
      const peerConnection = createPeerConnection();
      addLocalTracks(peerConnection);
    }
    
    // Manually set the state to connecting
    setConnectionState(CALL_STATES.CONNECTING);
    
    // Set a timeout to detect if connection isn't established within reasonable time
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    
    connectionTimeoutRef.current = setTimeout(() => {
      if (peerConnectionRef.current && 
          peerConnectionRef.current.connectionState !== 'connected') {
        console.warn('Connection timeout - still not connected after 30 seconds');
        // Don't set error state here, just log it
      }
    }, 30000); // 30 seconds timeout
    
    try {
      // Create and set local description
      console.log('Creating offer...');
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      console.log('Setting local description...');
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('Local description set successfully');
      
      // If onSignalNeeded is provided, send the offer
      if (typeof onSignalNeeded === 'function') {
        try {
          console.log('Sending offer signal...');
          await onSignalNeeded({
            type: 'offer',
            sdp: peerConnectionRef.current.localDescription,
          });
          console.log('Offer signal sent successfully');
        } catch (signalError) {
          console.error('Error sending offer signal:', signalError);
          // Continue anyway since we already created the offer
        }
      } else {
        console.warn('onSignalNeeded function not provided, cannot send offer');
      }
      
      return offer;
    } catch (err) {
      const errorInfo = handleWebRTCError(err, 'createOffer');
      setError(errorInfo.userMessage);
      setConnectionState(CALL_STATES.ERROR);
      throw new ConnectionError(errorInfo.userMessage, errorInfo.errorCode);
    }
  }, [createPeerConnection, addLocalTracks, onSignalNeeded]);
  
  // Process an offer from the remote peer
  const handleOffer = useCallback(async (offer) => {
    console.log('Received offer from remote peer');
    
    // Wait for the local stream to be available
    if (!localStreamRef.current) {
      console.warn('Local stream not available yet, waiting...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!localStreamRef.current) {
        console.error('Local stream still not available after waiting');
        throw new Error('Local stream not available for handling offer');
      }
    }
    
    if (!peerConnectionRef.current) {
      console.log('No peer connection exists, creating one');
      const peerConnection = createPeerConnection();
      addLocalTracks(peerConnection);
    }
    
    // Manually set the state to connecting
    setConnectionState(CALL_STATES.CONNECTING);
    
    try {
      console.log('Setting remote description from offer...');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('Remote description set successfully');
      
      console.log('Creating answer...');
      const answer = await peerConnectionRef.current.createAnswer();
      console.log('Setting local description from answer...');
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('Local description set successfully');
      
      // Send this answer back to the offerer
      console.log('Sending answer signal...');
      onSignalNeeded({
        type: 'answer',
        sdp: peerConnectionRef.current.localDescription,
      });
      console.log('Answer signal sent successfully');
      
      // Process any queued ICE candidates now that we have a remote description
      if (iceCandidatesQueueRef.current.length > 0) {
        console.log(`Processing ${iceCandidatesQueueRef.current.length} queued ICE candidates`);
        while (iceCandidatesQueueRef.current.length > 0) {
          const candidate = iceCandidatesQueueRef.current.shift();
          await peerConnectionRef.current.addIceCandidate(candidate);
        }
      }
      
      return answer;
    } catch (err) {
      const errorInfo = handleWebRTCError(err, 'handleOffer');
      setError(errorInfo.userMessage);
      setConnectionState(CALL_STATES.ERROR);
      throw new ConnectionError(errorInfo.userMessage, errorInfo.errorCode);
    }
  }, [createPeerConnection, addLocalTracks, onSignalNeeded]);
  
  // Process an answer from the remote peer
  const handleAnswer = useCallback(async (answer) => {
    console.log('Received answer from remote peer');
    try {
      if (!peerConnectionRef.current) {
        throw new Error('No peer connection established');
      }
      
      if (peerConnectionRef.current.signalingState !== 'have-local-offer') {
        console.warn('Unexpected signaling state for handling answer:', peerConnectionRef.current.signalingState);
        return;
      }
      
      console.log('Setting remote description from answer...');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Remote description set successfully');
      
      // Process any queued ICE candidates now that we have a remote description
      if (iceCandidatesQueueRef.current.length > 0) {
        console.log(`Processing ${iceCandidatesQueueRef.current.length} queued ICE candidates`);
        while (iceCandidatesQueueRef.current.length > 0) {
          const candidate = iceCandidatesQueueRef.current.shift();
          await peerConnectionRef.current.addIceCandidate(candidate);
        }
      }
    } catch (err) {
      const errorInfo = handleWebRTCError(err, 'handleAnswer');
      setError(errorInfo.userMessage);
      setConnectionState(CALL_STATES.ERROR);
      throw new ConnectionError(errorInfo.userMessage, errorInfo.errorCode);
    }
  }, []);
  
  // Handle an ICE candidate from the remote peer
  const handleIceCandidate = useCallback(async (candidate) => {
    try {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        console.log('Adding ICE candidate immediately');
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Queue this candidate until we have a remote description
        console.log('Queueing ICE candidate for later');
        iceCandidatesQueueRef.current.push(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      const errorInfo = handleWebRTCError(err, 'handleIceCandidate');
      console.warn('Error handling ICE candidate:', errorInfo);
      // Not setting error state as these can sometimes fail harmlessly
    }
  }, []);
  
  // Close and clean up the connection
  const closeConnection = useCallback(() => {
    console.log('Closing WebRTC connection');
    
    // Clear any connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    setConnectionState(CALL_STATES.DISCONNECTED);
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Clear the remote stream but don't stop tracks as they're managed elsewhere
    setRemoteStream(null);
    iceCandidatesQueueRef.current = [];
    setError(null);
  }, []);
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Clear any connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      closeConnection();
    };
  }, [closeConnection]);

  return {
    connectionState,
    remoteStream,
    error,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    closeConnection,
    replaceLocalTracks,
    updateLocalStream,
  };
};

export default useWebRTC;
