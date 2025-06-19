import React, { useEffect, useState } from 'react';
import '../../styles/VideoCall.css';

const ConnectionStatus = ({ connectionState, peerCount = 0 }) => {
  const [showStatus, setShowStatus] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [dots, setDots] = useState('');

  // Add animated dots for loading states
  useEffect(() => {
    let interval;
    
    if (connectionState === 'connecting' || connectionState === 'new') {
      interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
    } else {
      setDots('');
    }
    
    return () => clearInterval(interval);
  }, [connectionState]);

  // Update status message based on connection state
  useEffect(() => {
    console.log('ConnectionStatus: connection state changed to', connectionState);
    
    switch (connectionState) {
      case 'new':
      case 'connecting':
        setStatusMessage('Establishing connection');
        setStatusType('info');
        setShowStatus(true);
        break;
      case 'connected':
        if (peerCount > 0) {
          setStatusMessage(`Connected with ${peerCount} ${peerCount === 1 ? 'peer' : 'peers'}`);
        } else {
          setStatusMessage('Connected. Waiting for others to join');
        }
        setStatusType('success');
        // Auto-hide success message after 5 seconds
        setTimeout(() => setShowStatus(false), 5000);
        break;
      case 'disconnected':
        setStatusMessage('Call ended');
        setStatusType('info');
        setShowStatus(true);
        break;
      case 'failed':
      case 'error':
        setStatusMessage('Connection failed. Please try again');
        setStatusType('error');
        setShowStatus(true);
        break;
      default:
        setShowStatus(false);
        break;
    }
  }, [connectionState, peerCount]);

  // Don't render if there's no status to show
  if (!showStatus) return null;

  return (
    <div className={`connection-status ${statusType}`}>
      <div className="status-icon">
        {statusType === 'info' && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {statusType === 'success' && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {statusType === 'error' && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="status-message">
        {statusMessage}{(connectionState === 'connecting' || connectionState === 'new') ? dots : ''}
      </div>
    </div>
  );
};

export default ConnectionStatus;
