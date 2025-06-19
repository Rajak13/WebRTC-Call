import { createContext, useContext, useState } from 'react';
import useCallState from '../hooks/useCallState';
import { CALL_STATES } from '../lib/constants';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const callState = useCallState();

  // Any additional state management can be done here
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');

  // Helper functions
  const openInviteModal = () => {
    setShowInviteModal(true);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
  };

  const isInCall = callState.connectionState === CALL_STATES.CONNECTED || 
                  callState.connectionState === CALL_STATES.CONNECTING;

  // Values to share with the whole app
  const contextValue = {
    ...callState,
    showInviteModal,
    openInviteModal,
    closeInviteModal,
    joinRoomId,
    setJoinRoomId,
    isInCall,
  };

  return (
    <CallContext.Provider value={contextValue}>
      {children}
    </CallContext.Provider>
  );
};

// Custom hook to use the call context
export const useCall = () => {
  const context = useContext(CallContext);
  
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  
  return context;
};

export default CallContext;
