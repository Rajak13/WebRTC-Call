import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Layout/Footer';
import Header from '../components/Layout/Header';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { useCall } from '../contexts/CallContext';
import '../styles/Pages.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { startCall, joinCall } = useCall();
  
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Start a new call and redirect to call page
  const handleStartCall = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const newRoomId = await startCall();
      
      if (!newRoomId) {
        throw new Error('Failed to create room. Please try again.');
      }
      
      navigate(`/call/${newRoomId}`);
    } catch (err) {
      setError(err.message || 'Failed to start call. Please try again.');
      console.error('Start call error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Join an existing call
  const handleJoinCall = async () => {
    if (!roomId || !roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await joinCall(roomId.trim());
      navigate(`/call/${roomId.trim()}`);
    } catch (err) {
      setError(err.message || 'Failed to join call. Please check the room ID and try again.');
      console.error('Join call error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleRoomIdChange = (e) => {
    setRoomId(e.target.value);
    setError(null); // Clear error when input changes
  };

  return (
    <div className="home-container">
      <Header />
      
      <main className="home-content">
        <div className="home-hero">
          <h1 className="home-hero-title">
              Connect instantly with WebRTC
            </h1>
          <p className="home-hero-subtitle">
              High-quality, secure video calls with screen sharing, powered by WebRTC 
              and Supabase
            </p>
          </div>

        <div className="home-main">
          <div className="call-options">
              {/* Start a call card */}
            <div className="call-card">
              <div className="call-card-content">
                <div className="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                <h3 className="call-card-title">
                    Start a New Call
                  </h3>
                <p className="call-card-description">
                    Create a new room and invite others to join. You'll get a unique room ID that you can share.
                  </p>
                <div className="call-card-action">
                    <Button 
                      onClick={handleStartCall} 
                      disabled={isLoading}
                      fullWidth
                    >
                      {isLoading ? 'Starting...' : 'Start Call'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Join a call card */}
            <div className="call-card">
              <div className="call-card-content">
                <div className="feature-icon purple">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                <h3 className="call-card-title">
                    Join a Call
                  </h3>
                <p className="call-card-description">
                    Have a room ID already? Enter it below to join an existing call.
                  </p>
                <div className="call-card-action">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        console.log('Join Existing Call button clicked');
                        setIsJoinModalOpen(true);
                      }}
                      fullWidth
                    >
                      Join Existing Call
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features section */}
          <section className="features-section">
            <h2 className="features-title">Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg className="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                <h3 className="feature-title">
                    Secure Connections
                  </h3>
                <p className="feature-description">
                    All calls are peer-to-peer and encrypted. Your data never passes through our servers.
                  </p>
                </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg className="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                <h3 className="feature-title">
                    Screen Sharing
                  </h3>
                <p className="feature-description">
                    Share your screen during calls for presentations and collaboration.
                  </p>
                </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg className="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                <h3 className="feature-title">
                    No Registration Required
                  </h3>
                <p className="feature-description">
                    Start or join calls instantly without creating an account. Just open and connect.
                  </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Join call modal */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Join a Call"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => setIsJoinModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleJoinCall}
              disabled={isLoading}
            >
              {isLoading ? 'Joining...' : 'Join'}
            </Button>
          </>
        }
      >
        <div className="modal-form">
          <p className="modal-description">
            Enter the room ID you received from the call host.
          </p>
          <div className="form-group">
            <label htmlFor="roomId" className="form-label">
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={handleRoomIdChange}
              className="form-input"
              placeholder="Enter room ID"
            />
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
