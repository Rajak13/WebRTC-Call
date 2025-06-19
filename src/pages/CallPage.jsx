import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Layout/Header';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import VideoCallRoom from '../components/VideoCall/VideoCallRoom';
import { useCall } from '../contexts/CallContext';
import { CALL_STATES } from '../lib/constants';
import '../styles/Pages.css';

const CallPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    joinCall,
    endCall,
    startCall,
    localStream,
    remoteStream,
    connectionState,
    error,
    toggleAudio,
    toggleVideo,
    toggleScreenSharing,
    hasAudio,
    hasVideo,
    isScreenSharing,
  } = useCall();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const hasInitializedRef = useRef(false);
  const currentPathRef = useRef(location.pathname);

  // Initialize the call when component mounts
  useEffect(() => {
    // Track the current path to detect navigation changes
    currentPathRef.current = location.pathname;
    
    // Prevent multiple initializations
    if (hasInitializedRef.current) {
      console.log('Call already initialized, skipping initialization');
      setIsInitializing(false);
      return;
    }

    const initializeCall = async () => {
      try {
        console.log('Initializing call, roomId:', roomId);
        setIsInitializing(true);
        
        if (roomId) {
          // Join existing call
          console.log('Joining existing call with roomId:', roomId);
          await joinCall(roomId);
        } else {
          // No room ID in URL, create a new call
          console.log('Creating new call');
          const newRoomId = await startCall();
          console.log('New call created with roomId:', newRoomId);
          
          // Update URL with new room ID without causing a re-render
          if (newRoomId) {
            navigate(`/call/${newRoomId}`, { replace: true });
          }
        }
        
        // Mark as initialized to prevent re-initialization
        hasInitializedRef.current = true;
      } catch (err) {
        console.error('Failed to initialize call:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeCall();

    // Clean up on unmount or navigation away
    return () => {
      // Only clean up if we're actually navigating away from the call page
      const isNavigatingAway = !location.pathname.startsWith('/call');
      
      if (isNavigatingAway) {
        console.log('CallPage component unmounting or navigating away, cleaning up');
        endCall();
        hasInitializedRef.current = false;
      } else {
        console.log('Navigation within call pages, preserving call state');
      }
    };
  }, []);  // Empty dependency array to run only once

  // Get connection status display info
  const getConnectionStatusInfo = () => {
    switch (connectionState) {
      case CALL_STATES.CONNECTED:
        return { label: 'Connected', class: 'connected' };
      case CALL_STATES.CONNECTING:
        return { label: 'Connecting', class: 'connecting' };
      case CALL_STATES.DISCONNECTED:
        return { label: 'Disconnected', class: 'disconnected' };
      case CALL_STATES.ERROR:
        return { label: 'Error', class: 'disconnected' };
      default:
        return { label: 'Idle', class: 'disconnected' };
    }
  };

  const statusInfo = getConnectionStatusInfo();

  // Handle copying invite link
  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/call/${roomId}`;
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  // Handle leaving the call
  const handleLeaveCall = () => {
    hasInitializedRef.current = false; // Reset initialization state
    endCall();
    navigate('/');
  };

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <div className="call-page loading">
        <Header />
        <div className="loading-container">
          <div className="loading-content">
            <LoadingSpinner size="lg" />
            <p className="loading-text">
              Initializing call...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error screen if something went wrong
  if (error && connectionState === CALL_STATES.ERROR) {
    return (
      <div className="call-page error">
        <Header />
        <div className="error-container">
          <div className="error-content">
            <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="error-title">
              Connection Error
            </h2>
            <p className="error-message">
              {error || 'Failed to connect to the call. Please try again.'}
            </p>
            <div className="error-action">
              <Button onClick={() => navigate('/')}>
                Return Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="call-page">
      <Header />
      
      <main className="call-main">
        <div className="call-header">
          <div className="call-title">
            <div className="call-title-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            Video Call
            <div className="call-status">
              <span className={`status-indicator ${statusInfo.class}`}></span>
              {statusInfo.label}
            </div>
          </div>
          <div className="call-actions">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
            >
              Invite
            </Button>
            <Button 
              variant="danger" 
              size="sm"
              onClick={handleLeaveCall}
            >
              Leave Call
            </Button>
          </div>
        </div>
        
        {/* Active call interface */}
        <div className="call-container">
          <VideoCallRoom
            localStream={localStream}
            remoteStream={remoteStream}
            connectionState={connectionState}
            onToggleMute={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleScreenShare={toggleScreenSharing}
            onEndCall={handleLeaveCall}
            isMuted={!hasAudio}
            isVideoOff={!hasVideo}
            isScreenSharing={isScreenSharing}
          />
        </div>
      </main>
      
      {/* Invite modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite to Call"
        size="sm"
      >
        <div className="invite-modal">
          <p className="invite-description">
            Share this link or room ID with others to invite them to your call:
          </p>
          
          <div className="invite-form">
            <label className="invite-label">
              Room ID
            </label>
            <div className="invite-input-group">
              <input
                type="text"
                value={roomId}
                readOnly
                className="invite-input"
              />
              <Button
                variant={copySuccess ? "success" : "primary"}
                className="invite-button"
                onClick={handleCopyInviteLink}
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
          
          <div className="invite-help">
            <p className="invite-help-text">
              Anyone with this link can join the call.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CallPage;
