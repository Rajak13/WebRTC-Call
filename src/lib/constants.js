// src/lib/constants.js

// WebRTC Configuration Constants
// These settings optimize connection establishment and media quality
export const WEBRTC_CONFIG = {
    // ICE servers help browsers find the best path to connect to each other
    // These are public STUN servers provided by Google
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ],
    // Control how ICE candidates are gathered
    iceCandidatePoolSize: 10,
}

// Media constraints define the quality and features we want from user devices
export const MEDIA_CONSTRAINTS = {
    video: {
        width: { ideal: 1280 },      // Prefer 720p quality
        height: { ideal: 720 },
        facingMode: 'user',          // Use front-facing camera by default
        frameRate: { ideal: 30 },    // Smooth 30fps video
    },
    audio: {
        echoCancellation: true,      // Remove echo for better call quality
        noiseSuppression: true,      // Filter background noise
        autoGainControl: true,       // Automatically adjust microphone levels
    },
}

// Supabase table and channel names
export const SUPABASE_CONFIG = {
    SIGNALING_TABLE: 'webrtc_signaling',
    ROOMS_TABLE: 'call_rooms',
}

// Call states help us track what's happening during the connection process
export const CALL_STATES = {
    IDLE: 'idle',                    // No call in progress
    CONNECTING: 'connecting',        // Attempting to establish connection
    CONNECTED: 'connected',          // Successfully connected
    DISCONNECTED: 'disconnected',    // Call ended or failed
    ERROR: 'error',                  // Something went wrong
}

// Signaling message types coordinate the connection process
export const SIGNALING_TYPES = {
    OFFER: 'OFFER',                  // Initial connection proposal
    ANSWER: 'ANSWER',                // Response to connection proposal
    ICE_CANDIDATE: 'ICE_CANDIDATE',  // Network routing information
    HANGUP: 'HANGUP',                // End call signal
}

// Database to application type mapping
export const SIGNAL_TYPE_MAPPING = {
    // Database format to application format
    OFFER: 'offer',
    ANSWER: 'answer',
    ICE_CANDIDATE: 'ice-candidate',
    HANGUP: 'hangup',
    // Application format to database format
    offer: 'OFFER',
    answer: 'ANSWER',
    'ice-candidate': 'ICE_CANDIDATE',
    hangup: 'HANGUP'
}

// Error messages provide clear feedback to users
export const ERROR_MESSAGES = {
    MEDIA_ACCESS_DENIED: 'Camera and microphone access is required for video calls.',
    CONNECTION_FAILED: 'Failed to establish connection. Please try again.',
    ROOM_NOT_FOUND: 'Call room not found. Please check the room ID.',
    SIGNALING_ERROR: 'Communication error. Please refresh and try again.',
}

// UI Configuration
export const UI_CONFIG = {
    TOAST_DURATION: 3000,           // How long success/error messages show
    CONNECTION_TIMEOUT: 30000,      // Maximum time to wait for connection
    RECONNECT_ATTEMPTS: 3,          // How many times to retry failed connections
}