import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import VideoCallRoom from '../components/VideoCall/VideoCallRoom';
import { useCall } from '../contexts/CallContext';
import '../styles/Pages.css';

const CallPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initialize = async () => {
      try {
        if (roomId) {
          await joinCall(roomId);
        } else {
          const newRoomId = await startCall();
          navigate(`/call/${newRoomId}`, { replace: true });
        }
      } catch (err) {
        console.error('Initialization failed:', err);
        navigate('/error', { state: { message: err.message } });
      } finally {
        setIsInitializing(false);
      }
    };
    initialize();
  }, [roomId, joinCall, startCall, navigate]);

  const handleLeaveCall = () => {
    endCall();
    navigate('/');
  };
  
  const handleCopyInvite = () => {
    const inviteLink = window.location.href;
    navigator.clipboard.writeText(inviteLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (isInitializing) {
    return <LoadingScreen message="Connecting to call..." />;
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="call-page">
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
        onInviteClick={() => setIsInviteModalOpen(true)}
      />

      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Others"
      >
        <div className="invite-modal-content">
          <p>Share this link to invite others to the call:</p>
          <div className="invite-link-container">
            <input 
              type="text" 
              readOnly 
              value={window.location.href}
              className="invite-link-input"
            />
            <Button onClick={handleCopyInvite} className="copy-button">
              {copySuccess ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Loading and Error screen components
const LoadingScreen = ({ message }) => (
  <div className="call-loading-container">
    <div className="call-loading-content">
      <LoadingSpinner size="large" />
      <p className="call-loading-text">{message}</p>
    </div>
  </div>
);

const ErrorScreen = ({ message, onRetry }) => (
  <div className="call-error-container">
    <div className="call-error-content">
      <div className="call-error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="call-error-title">Connection Failed</h2>
      <p className="call-error-message">{message}</p>
      <Button onClick={onRetry} className="retry-button">
        Try Again
      </Button>
    </div>
  </div>
);

export default CallPage;
