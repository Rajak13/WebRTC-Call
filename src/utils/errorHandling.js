// src/utils/errorHandling.js
import { ERROR_MESSAGES } from '../lib/constants.js'

/**
 * Custom error classes for different types of failures
 * This helps us categorize errors and handle them appropriately
 */

export class MediaError extends Error {
    constructor(message, code = 'MEDIA_ERROR') {
        super(message)
        this.name = 'MediaError'
        this.code = code
    }
}

export class ConnectionError extends Error {
    constructor(message, code = 'CONNECTION_ERROR') {
        super(message)
        this.name = 'ConnectionError'
        this.code = code
    }
}

export class SignalingError extends Error {
    constructor(message, code = 'SIGNALING_ERROR') {
        super(message)
        this.name = 'SignalingError'
        this.code = code
    }
}

/**
 * Logs errors with consistent formatting and additional context
 * This helps with debugging and monitoring application health
 * @param {Error} error - The error that occurred
 * @param {string} context - Where the error happened
 * @param {Object} additionalInfo - Extra information about the error
 */
export const logError = (error, context, additionalInfo = {}) => {
    const errorInfo = {
        timestamp: new Date().toISOString(),
        context,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...additionalInfo,
    }

    console.error(`[${context}] Error occurred:`, errorInfo)

    // In a production application, you might also send this to an error tracking service
    // like Sentry, LogRocket, or Rollbar for monitoring and debugging
    return errorInfo
}

// Alias for logError to maintain compatibility with both function names
export const recordError = logError;

/**
 * Handles WebRTC-specific errors with appropriate user-friendly messages
 * @param {Error} error - The WebRTC error
 * @param {string} operation - What operation was being attempted
 * @returns {Object} - Processed error information
 */
export const handleWebRTCError = (error, operation) => {
    let userMessage = ERROR_MESSAGES.CONNECTION_FAILED
    let errorCode = 'WEBRTC_UNKNOWN'

    // Map technical error messages to user-friendly explanations
    if (error.name === 'NotAllowedError') {
        userMessage = ERROR_MESSAGES.MEDIA_ACCESS_DENIED
        errorCode = 'MEDIA_PERMISSION_DENIED'
    } else if (error.name === 'NotFoundError') {
        userMessage = 'No camera or microphone was found on this device.'
        errorCode = 'MEDIA_DEVICE_NOT_FOUND'
    } else if (error.name === 'NotReadableError') {
        userMessage = 'Your camera or microphone is being used by another application.'
        errorCode = 'MEDIA_DEVICE_IN_USE'
    } else if (error.name === 'OverconstrainedError') {
        userMessage = 'Your device doesn\'t support the requested video quality.'
        errorCode = 'MEDIA_CONSTRAINTS_UNSUPPORTED'
    } else if (error.name === 'NotSupportedError') {
        userMessage = 'Your browser doesn\'t support video calling.'
        errorCode = 'WEBRTC_NOT_SUPPORTED'
    } else if (error.message.includes('ICE')) {
        userMessage = 'Network connection failed. Please check your internet connection.'
        errorCode = 'ICE_CONNECTION_FAILED'
    } else if (error.message.includes('DTLS')) {
        userMessage = 'Secure connection could not be established.'
        errorCode = 'DTLS_CONNECTION_FAILED'
    }

    const errorDetails = logError(error, `WebRTC ${operation}`, {
        operation,
        errorCode,
        userMessage,
    })

    return errorDetails;
}