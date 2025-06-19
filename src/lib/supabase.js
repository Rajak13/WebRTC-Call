// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// These environment variables connect us to our specific Supabase project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate that our environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please check your .env.local file and ensure ' +
        'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are properly set.'
    )
}

// Create and configure our Supabase client
// This client will handle all communication with our backend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    // Configure real-time subscriptions for instant message delivery
    realtime: {
        params: {
            eventsPerSecond: 10, // Limit events to prevent spam during rapid signaling
        },
    },
    // Configure authentication behavior
    auth: {
        autoRefreshToken: true, // Automatically refresh expired tokens
        persistSession: true,   // Remember user login across browser sessions
    },
})

// Helper function to generate unique room IDs for video calls
// This creates a shared space where two users can exchange connection info
export const generateRoomId = () => {
    // Create a random string that's easy to share but hard to guess
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
}

// Helper function to validate room ID format
export const isValidRoomId = (roomId) => {
    // Check that room ID exists and has reasonable length
    return roomId && typeof roomId === 'string' && roomId.length >= 8
}