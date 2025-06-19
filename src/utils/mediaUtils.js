// src/utils/mediaUtils.js
import { ERROR_MESSAGES, MEDIA_CONSTRAINTS } from '../lib/constants.js'

/**
 * Requests access to user's camera and microphone
 * This is like asking permission to use someone's recording equipment
 * @param {Object} constraints - Optional custom constraints for media quality
 * @returns {Promise<MediaStream>} - The user's audio/video stream
 */
export const getUserMediaStream = async (constraints = MEDIA_CONSTRAINTS) => {
    try {
        console.log('Requesting user media with constraints:', constraints)

        // Ask the browser to access the user's camera and microphone
        // This will trigger a permission prompt if not already granted
        const stream = await navigator.mediaDevices.getUserMedia(constraints)

        console.log('Successfully obtained user media stream:', {
            videoTracks: stream.getVideoTracks().length,
            audioTracks: stream.getAudioTracks().length,
        })

        return stream
    } catch (error) {
        console.error('Failed to get user media:', error)

        // Provide helpful error messages based on what went wrong
        if (error.name === 'NotAllowedError') {
            throw new Error(ERROR_MESSAGES.MEDIA_ACCESS_DENIED)
        } else if (error.name === 'NotFoundError') {
            throw new Error('No camera or microphone found on this device.')
        } else if (error.name === 'NotReadableError') {
            throw new Error('Camera or microphone is already in use by another application.')
        } else {
            throw new Error(`Media access error: ${error.message}`)
        }
    }
}

/**
 * Gets a list of available media devices (cameras and microphones)
 * This helps users choose which devices to use for their call
 * @returns {Promise<Object>} - Object containing arrays of video and audio devices
 */
export const getAvailableDevices = async () => {
    try {
        // Request device list from the browser
        const devices = await navigator.mediaDevices.enumerateDevices()

        // Separate devices by type for easier use
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        const audioDevices = devices.filter(device => device.kind === 'audioinput')

        console.log('Available devices:', {
            cameras: videoDevices.length,
            microphones: audioDevices.length,
        })

        return {
            videoDevices,
            audioDevices,
        }
    } catch (error) {
        console.error('Failed to enumerate devices:', error)
        return {
            videoDevices: [],
            audioDevices: [],
        }
    }
}

/**
 * Switches to a different camera or microphone
 * This allows users to change devices during a call
 * @param {string} deviceId - ID of the device to switch to
 * @param {string} deviceType - 'video' or 'audio'
 * @param {MediaStream} currentStream - The current media stream to replace
 * @returns {Promise<MediaStream>} - New stream with the selected device
 */
export const switchMediaDevice = async (deviceId, deviceType, currentStream) => {
    try {
        // Create constraints for the specific device
        const constraints = { ...MEDIA_CONSTRAINTS }

        if (deviceType === 'video') {
            constraints.video.deviceId = { exact: deviceId }
        } else if (deviceType === 'audio') {
            constraints.audio.deviceId = { exact: deviceId }
        }

        // Get new stream with the selected device
        const newStream = await navigator.mediaDevices.getUserMedia(constraints)

        // Stop the old stream to free up the previous device
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop())
        }

        console.log(`Switched to new ${deviceType} device:`, deviceId)
        return newStream
    } catch (error) {
        console.error(`Failed to switch ${deviceType} device:`, error)
        throw error
    }
}

/**
 * Toggles audio track on/off (mute/unmute)
 * @param {MediaStream} stream - The media stream to modify
 * @param {boolean} enabled - Whether audio should be enabled
 */
export const toggleAudio = (stream, enabled) => {
    if (!stream) return false

    const audioTracks = stream.getAudioTracks()
    audioTracks.forEach(track => {
        track.enabled = enabled
    })

    console.log(`Audio ${enabled ? 'enabled' : 'disabled'}`)
    return enabled
}

/**
 * Toggles video track on/off (camera on/off)
 * @param {MediaStream} stream - The media stream to modify
 * @param {boolean} enabled - Whether video should be enabled
 */
export const toggleVideo = (stream, enabled) => {
    if (!stream) return false

    const videoTracks = stream.getVideoTracks()
    videoTracks.forEach(track => {
        track.enabled = enabled
    })

    console.log(`Video ${enabled ? 'enabled' : 'disabled'}`)
    return enabled
}

/**
 * Safely stops all tracks in a media stream
 * This is important for properly releasing device resources
 * @param {MediaStream} stream - The stream to stop
 */
export const stopMediaStream = (stream) => {
    if (!stream) return

    stream.getTracks().forEach(track => {
        track.stop()
        console.log(`Stopped ${track.kind} track`)
    })
}

/**
 * Checks if the browser supports the required WebRTC features
 * @returns {Object} - Object indicating which features are supported
 */
export const checkWebRTCSupport = () => {
    const support = {
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        RTCPeerConnection: !!window.RTCPeerConnection,
        webRTC: false,
    }

    support.webRTC = support.getUserMedia && support.RTCPeerConnection

    console.log('WebRTC support check:', support)
    return support
}

/**
 * Gets statistics about a media stream
 * Useful for debugging and monitoring call quality
 * @param {MediaStream} stream - The stream to analyze
 * @returns {Object} - Stream statistics
 */
export const getStreamStats = (stream) => {
    if (!stream) return null

    const videoTracks = stream.getVideoTracks()
    const audioTracks = stream.getAudioTracks()

    const stats = {
        id: stream.id,
        active: stream.active,
        videoTracks: videoTracks.map(track => ({
            id: track.id,
            kind: track.kind,
            label: track.label,
            enabled: track.enabled,
            readyState: track.readyState,
            settings: track.getSettings(),
        })),
        audioTracks: audioTracks.map(track => ({
            id: track.id,
            kind: track.kind,
            label: track.label,
            enabled: track.enabled,
            readyState: track.readyState,
            settings: track.getSettings(),
        })),
    }

    return stats
}