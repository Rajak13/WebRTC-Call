import { useCallback, useEffect, useRef, useState } from 'react';
import { SIGNAL_TYPE_MAPPING, SIGNALING_TYPES } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { recordError, SignalingError } from '../utils/errorHandling';

/**
 * Hook for Supabase Realtime-based WebRTC signaling
 * @param {string|null} currentRoomId - Current room ID for the call
 * @returns {Object} Signaling methods and state
 */
const useSupabaseRealtime = (currentRoomId) => {
  // State for errors that occur during signaling
  const [error, setError] = useState(null);

  // Reference to keep track of our subscription
  const subscriptionRef = useRef(null);
  // Reference to prevent race conditions with room changes
  const roomIdRef = useRef(currentRoomId);
  
  // Update ref when the roomId prop changes
  useEffect(() => {
    if (currentRoomId) {
      // Only log this once when the room ID is first set
      if (roomIdRef.current !== currentRoomId) {
        console.log('Updating roomIdRef to:', currentRoomId);
        }
      roomIdRef.current = currentRoomId;
    }
  }, [currentRoomId]);

  // Reference to track unmounting state to avoid unnecessary error logs
  const isUnmountingRef = useRef(false);
  
  // Custom wrapper for recordError that checks for unmounting state
  const safeRecordError = useCallback((err, context) => {
    // Only log errors if not during unmounting process
    if (!isUnmountingRef.current) {
      recordError(err, context);
    }
  }, []);
  
  /**
   * Creates a new room for signaling
   * @returns {Promise<string>} A promise that resolves to the new room ID
   */
  const createRoom = useCallback(async () => {
    try {
      // Let Supabase generate the UUID automatically
      const { data, error } = await supabase
        .from('call_rooms')
        .insert([{ created_at: new Date().toISOString() }])
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to create room: ${error.message}`);
      }

      if (!data || !data.id) {
        throw new Error('Failed to retrieve room ID after creation');
      }

      return data.id;
    } catch (err) {
      safeRecordError(err, 'Supabase Realtime');
      setError(`Failed to create room: ${err.message}`);
      throw err;
    }
  }, [safeRecordError]);

  /**
   * Join an existing room
   * @param {string} roomId - ID of the room to join
   * @returns {Promise<string>} A promise that resolves to the validated room ID
   */
  const joinRoom = useCallback(async (roomId) => {
    if (!roomId) {
      const error = new SignalingError('Room ID is required to join a call');
      setError(error.message);
      throw error;
    }

    try {
      // Validate that the room exists
      const { data, error } = await supabase
        .from('call_rooms')
        .select('id')
        .eq('id', roomId)
        .single();

      if (error || !data) {
        const notFoundError = new SignalingError(`Room ${roomId} not found or no longer active`);
        setError(notFoundError.message);
        throw notFoundError;
      }

      return roomId;
    } catch (err) {
      safeRecordError(err, 'Supabase Realtime');
      setError(err.message || `Failed to join room: ${roomId}`);
      throw err;
    }
  }, [safeRecordError]);

  /**
   * Send a signaling message over Supabase Realtime
   * @param {Object} signal - Signal data to send
   * @returns {Promise<void>}
   */
  const sendSignal = useCallback(async (signal) => {
    // Use ref to prevent closure issues with stale roomId
    const roomId = roomIdRef.current || currentRoomId;
    
    if (!roomId) {
      const error = new SignalingError('Room ID is required for signaling. Please create or join a room first.');
      safeRecordError(error, 'Supabase Realtime');
      setError(error.message);
      throw error;
    }
    
    try {
      // Only log for important signals like offer/answer, not for every ICE candidate
      if (signal.type !== 'iceCandidate') {
        console.log('Sending signal with type:', signal.type, 'for room:', roomId);
      }
      
      // Convert application signal type to database format
      const dbType = SIGNAL_TYPE_MAPPING[signal.type] || signal.type.toUpperCase();
      
      // Prepare signal data based on type
      let signalData;
      if (signal.type === 'ice-candidate' || signal.type === SIGNALING_TYPES.ICE_CANDIDATE) {
        signalData = { candidate: signal.candidate };
      } else if (signal.sdp) {
        signalData = { sdp: signal.sdp };
      } else {
        signalData = {};
      }
      
      // Send the signal to the specific room channel
      const { error } = await supabase
        .from('webrtc_signaling')
        .insert([
          { 
            room_id: roomId,
            type: dbType,
            data: signalData,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        throw new Error(`Failed to send signal: ${error.message}`);
      }
    } catch (err) {
      safeRecordError(err, 'Supabase Realtime');
      setError(`Failed to send signal: ${err.message}`);
      throw err;
    }
  }, [currentRoomId, safeRecordError]);

  /**
   * Listen for incoming signaling messages
   * @param {Function} onSignal - Callback to handle incoming signals
   * @returns {Function} Cleanup function to remove the subscription
   */
  const listenForSignals = useCallback((onSignal) => {
    // Use ref to prevent closure issues with stale roomId
    const roomId = roomIdRef.current || currentRoomId;
    
    if (!roomId) {
      const error = new SignalingError('Room ID is required for listening to signals');
      safeRecordError(error, 'Supabase Realtime');
      setError(error.message);
      // Return a no-op cleanup function
      return () => {};
    }

    try {
      // Clean up any existing subscription first to prevent duplicates
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        } catch (err) {
          // Just log but don't throw - we're trying to clean up
          console.warn('Error unsubscribing from previous channel:', err);
        }
      }

      // Only log when setting up a new listener
      console.log('Setting up signal listener for room:', roomId);

      // Create a unique channel name with timestamp to prevent reusing cached channels
      const channelName = `signaling:${roomId}:${Date.now()}`;
      
      // Subscribe to messages in this room
      const subscription = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'webrtc_signaling',
            filter: `room_id=eq.${roomId}`
          }, 
          (payload) => {
            if (payload.new) {
              const signal = payload.new;
              
              // Convert from database format to application format using our mapping
              const appType = SIGNAL_TYPE_MAPPING[signal.type] || signal.type.toLowerCase();
              
              // Create the appropriate signal format based on type
              let signalData;
              if (signal.type === SIGNALING_TYPES.OFFER || signal.type === SIGNALING_TYPES.ANSWER) {
                signalData = {
                  type: appType,
                  sdp: signal.data.sdp,
                };
              } else if (signal.type === SIGNALING_TYPES.ICE_CANDIDATE) {
                signalData = {
                  type: appType,
                  candidate: signal.data.candidate,
                };
              } else if (signal.type === SIGNALING_TYPES.HANGUP) {
                signalData = {
                  type: appType,
                };
              }
              
              if (signalData) {
                onSignal(signalData);
              }
            }
          }
        )
        .subscribe((status) => {
          // Only log errors for non-CLOSED statuses and when not unmounting
          if (status !== 'SUBSCRIBED' && status !== 'CLOSED' && !isUnmountingRef.current) {
            const error = new Error(`Subscription status: ${status}`);
            safeRecordError(error, 'Supabase Realtime');
          }
        });

      // Store the subscription for cleanup
      subscriptionRef.current = subscription;

      // Return cleanup function
      return () => {
        if (subscriptionRef.current) {
          try {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
          } catch (err) {
            // Just log the error since we're cleaning up
            console.warn('Error during subscription cleanup:', err);
          }
        }
      };
    } catch (err) {
      safeRecordError(err, 'Supabase Realtime');
      setError(`Failed to set up signal listener: ${err.message}`);
      // Return a no-op cleanup function
      return () => {};
    }
  }, [currentRoomId, safeRecordError]);

  // Clean up subscriptions when component unmounts or roomId changes
  useEffect(() => {
    // Return cleanup function
    return () => {
      // Mark that we're unmounting to avoid logging normal cleanup as errors
      isUnmountingRef.current = true;
      
      // Immediately clean up subscription instead of using setTimeout
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
        } catch (err) {
          // We're already unmounting, so just log the error if needed
          if (!isUnmountingRef.current) {
            safeRecordError(err, 'Supabase Realtime Cleanup');
          }
        } finally {
          subscriptionRef.current = null;
        }
      }
      
      // Clear room ID ref to prevent stale values
      roomIdRef.current = null;
    };
  }, [currentRoomId, safeRecordError]);

  return {
    error,
    sendSignal,
    listenForSignals,
    createRoom,
    joinRoom,
  };
};

export default useSupabaseRealtime;
