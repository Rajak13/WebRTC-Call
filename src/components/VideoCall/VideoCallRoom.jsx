import { useEffect, useState } from 'react';
import '../../styles/VideoCall.css';
import CallControls from './CallControls';
import ConnectionStatus from './ConnectionStatus';
import LocalVideo from './LocalVideo';
import RemoteVideo from './RemoteVideo';

const VideoCallRoom = ({ 
  localStream, 
  remoteStream,
  connectionState = 'new',
  onToggleMute, 
  onToggleVideo, 
  onToggleScreenShare,
  onEndCall,
  onInviteClick,
  isMuted = false,
  isVideoOff = false,
  isScreenSharing = false,
  className = ""
}) => {
  const [layout, setLayout] = useState('grid'); // 'grid', 'spotlight'
  const [isMobile, setIsMobile] = useState(false);
  
  // Convert single remoteStream to array for consistent handling
  const remoteStreams = remoteStream ? [remoteStream] : [];
  const peerCount = remoteStreams.length;

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-switch to spotlight layout on mobile when there are remote participants
  useEffect(() => {
    if (isMobile && peerCount > 0 && layout === 'grid') {
      setLayout('spotlight');
    }
  }, [isMobile, peerCount, layout]);

  // Toggle between grid and spotlight layout
  const toggleLayout = () => {
    setLayout(layout === 'grid' ? 'spotlight' : 'grid');
  };

  return (
    <div className={`video-call-room ${className}`}>
      {/* Connection status banner */}
      <div className="connection-status-container">
        <ConnectionStatus 
          connectionState={connectionState}
          peerCount={peerCount}
        />
      </div>
      
      {/* Layout toggle button - only show on desktop or when multiple participants */}
      {(!isMobile || peerCount > 1) && peerCount > 0 && (
        <button
          onClick={toggleLayout}
          className="layout-toggle-button"
          aria-label={`Switch to ${layout === 'grid' ? 'spotlight' : 'grid'} layout`}
          title={`Switch to ${layout === 'grid' ? 'spotlight' : 'grid'} layout`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="layout-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {layout === 'grid' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            )}
          </svg>
        </button>
      )}

      {/* Main content area */}
      <div className="video-container">
        {/* Grid layout - shows all videos in a responsive grid */}
        {layout === 'grid' ? (
          <div className={`video-grid ${getGridCols(peerCount, isMobile)}`}>
            {/* Local video */}
            <div className="video-wrapper">
              <LocalVideo 
                stream={localStream} 
                isMuted={isMuted} 
                isVideoOff={isVideoOff}
                className="local-video"
              />
            </div>

            {/* Remote videos */}
            {remoteStreams.map((stream, index) => (
              <div key={index} className="video-wrapper">
                <RemoteVideo 
                  stream={stream} 
                  username={`Peer ${index + 1}`}
                  hasAudio={true} 
                  hasVideo={true}
                  className="remote-video"
                />
              </div>
            ))}
          </div>
        ) : (
          // Spotlight layout - main video with smaller videos below/beside
          <div className="spotlight-layout">
            {/* Main video (first remote stream or local if no remote) */}
            <div className="spotlight-main">
              {remoteStreams.length > 0 ? (
                <RemoteVideo 
                  stream={remoteStreams[0]} 
                  username="Main Speaker"
                  hasAudio={true} 
                  hasVideo={true}
                  className="spotlight-video"
                />
              ) : (
                <LocalVideo 
                  stream={localStream} 
                  isMuted={isMuted} 
                  isVideoOff={isVideoOff}
                  className="spotlight-video"
                />
              )}
            </div>

            {/* Thumbnail videos */}
            {remoteStreams.length > 0 && (
              <div className="thumbnail-strip">
                {/* Always add local video to thumbnails in spotlight mode */}
                <div className="thumbnail-video">
                  <LocalVideo 
                    stream={localStream} 
                    isMuted={isMuted} 
                    isVideoOff={isVideoOff}
                    className="thumbnail-stream"
                  />
                </div>
                
                {/* Skip first remote video (shown as main) and add the rest */}
                {remoteStreams.slice(1).map((stream, index) => (
                  <div key={index} className="thumbnail-video">
                    <RemoteVideo 
                      stream={stream} 
                      username={`Peer ${index + 2}`}
                      hasAudio={true} 
                      hasVideo={true}
                      className="thumbnail-stream"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="call-controls-container">
        <CallControls 
          onToggleMute={onToggleMute} 
          onToggleVideo={onToggleVideo} 
          onToggleScreenShare={onToggleScreenShare}
          onEndCall={onEndCall}
          onInviteClick={onInviteClick}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
        />
      </div>
    </div>
  );
};

// Helper function to determine grid layout based on number of participants and device type
const getGridCols = (peerCount, isMobile) => {
  const totalParticipants = peerCount + 1; // +1 for local video
  
  if (isMobile) {
    // Mobile: always use single column for better touch interaction
    return 'grid-cols-1';
  }
  
  if (totalParticipants === 1) return 'grid-cols-1';
  if (totalParticipants === 2) return 'grid-cols-2';
  if (totalParticipants <= 4) return 'grid-cols-2';
  if (totalParticipants <= 6) return 'grid-cols-3';
  if (totalParticipants <= 9) return 'grid-cols-3';
  return 'grid-cols-4';
};

export default VideoCallRoom;
