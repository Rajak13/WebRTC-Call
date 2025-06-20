import { useEffect, useRef, useState } from 'react';
import '../../styles/VideoCall.css';

const CallControls = ({ 
  onToggleMute, 
  onToggleVideo, 
  onToggleScreenShare,
  onEndCall, 
  onInviteClick,
  isMuted = false, 
  isVideoOff = false,
  isScreenSharing = false
}) => {
  const [showTooltip, setShowTooltip] = useState('');
  const tooltipTimerRef = useRef(null);
  
  const handleCopyRoomId = () => {
    const roomId = window.location.pathname.split('/').pop();
    navigator.clipboard.writeText(roomId);
    showTooltipMessage('Room ID copied!');
  };

  const showTooltipMessage = (message) => {
    setShowTooltip(message);
    
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
    }
    
    tooltipTimerRef.current = setTimeout(() => {
      setShowTooltip('');
    }, 2000);
  };

  const handleButtonClick = (action, event) => {
    // Add visual feedback
    const button = event.currentTarget;
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = '';
    }, 150);
    
    action();
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="call-controls">
      {/* Mute Audio */}
      <button 
        className={`control-button ${isMuted ? 'active' : ''}`}
        onClick={(e) => handleButtonClick(onToggleMute, e)}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isMuted ? (
            <>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </>
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          )}
        </svg>
      </button>

      {/* Toggle Video */}
      <button 
        className={`control-button ${isVideoOff ? 'active' : ''}`}
        onClick={(e) => handleButtonClick(onToggleVideo, e)}
        aria-label={isVideoOff ? 'Start video camera' : 'Stop video camera'}
        title={isVideoOff ? 'Start video camera' : 'Stop video camera'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isVideoOff ? (
            <>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </>
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          )}
        </svg>
      </button>

      {/* Screen Share */}
      {onToggleScreenShare && (
        <button 
          className={`control-button ${isScreenSharing ? 'active' : ''}`}
          onClick={(e) => handleButtonClick(onToggleScreenShare, e)}
          aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>
      )}

      {/* Copy Room ID */}
      <button 
        className="control-button"
        onClick={(e) => handleButtonClick(handleCopyRoomId, e)}
        aria-label="Copy room ID to clipboard"
        title="Copy room ID to clipboard"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {showTooltip && (
          <div className="control-tooltip">
            {showTooltip}
          </div>
        )}
      </button>

      {/* Invite */}
      <button
        className="control-button"
        onClick={(e) => handleButtonClick(onInviteClick, e)}
        aria-label="Invite others to the call"
        title="Invite others to the call"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* End Call */}
      <button 
        className="control-button danger"
        onClick={(e) => handleButtonClick(onEndCall, e)}
        aria-label="End call"
        title="End call"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
        </svg>
      </button>
    </div>
  );
};

export default CallControls;
