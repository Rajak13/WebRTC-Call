// src/utils/signalingUtils.js
import { SUPABASE_CONFIG } from '../lib/constants.js'
import { supabase } from '../lib/supabase.js'

/**
 * Sends a signaling message through Supabase real-time channels
 * Think of this as passing notes between two people in different rooms
 * @param {string} roomId - The unique identifier for this call session
 * @param {string} type - The type of message (offer, answer, ice_candidate, etc.)
 * @param {Object} data - The actual message content
 * @param {string} senderId - Who is sending this message
 */
export const sendSignalingMessage = async (roomId, type, data, senderId) => {
    try {
        // Create a message object with all the necessary information
        const message = {
            room_id: roomId,
            type: type,
            payload: data,
            sender_id: senderId,
            created_at: new Date().toISOString(),
        }

        // Send the message to our signaling table in Supabase
        // This is like putting a letter in a shared mailbox
        const { error } = await supabase
            .from(SUPABASE_CONFIG.SIGNALING_TABLE)
            .insert(message)

        if (error) {
            console.error('Failed to send signaling message:', error)
            throw new Error(`Signaling failed: ${error.message}`)
        }

        console.log(`Sent ${type} message to room ${roomId}`)
        return true
    } catch (error) {
        console.error('Error in sendSignalingMessage:', error)
        throw error
    }
}

/**
 * Sets up a real-time subscription to listen for signaling messages
 * This is like having a mailbox that notifies you when new letters arrive
 * @param {string} roomId - The room to listen to
 * @param {string} userId - Our user ID (so we don't process our own messages)
 * @param {Function} onMessage - Callback function to handle incoming messages
 */
export const subscribeToSignalingMessages = (roomId, userId, onMessage) => {
    console.log(`Subscribing to signaling messages for room: ${roomId}`)

    // Create a real-time subscription to the signaling table
    const subscription = supabase
        .channel(`signaling:${roomId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: SUPABASE_CONFIG.SIGNALING_TABLE,
                filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
                const message = payload.new

                // Ignore messages we sent ourselves (avoid echo)
                if (message.sender_id === userId) {
                    return
                }

                console.log(`Received ${message.type} message in room ${roomId}:`, message)

                // Call the provided callback function with the message
                onMessage(message)
            }
        )
        .subscribe((status) => {
            console.log(`Subscription status for room ${roomId}:`, status)
        })

    // Return the subscription object so it can be cleaned up later
    return subscription
}

/**
 * Creates a new call room in the database
 * This establishes a space where two users can coordinate their connection
 * @param {string} roomId - Unique identifier for the room
 * @param {string} creatorId - ID of the user creating the room
 */
export const createCallRoom = async (roomId, creatorId) => {
    try {
        const roomData = {
            id: roomId,
            creator_id: creatorId,
            status: 'waiting',
            created_at: new Date().toISOString(),
        }

        const { error } = await supabase
            .from(SUPABASE_CONFIG.ROOMS_TABLE)
            .insert(roomData)

        if (error) {
            console.error('Failed to create call room:', error)
            throw new Error(`Room creation failed: ${error.message}`)
        }

        console.log(`Created call room: ${roomId}`)
        return true
    } catch (error) {
        console.error('Error in createCallRoom:', error)
        throw error
    }
}

/**
 * Joins an existing call room
 * This is like entering a conference room that someone else has set up
 * @param {string} roomId - The room to join
 * @param {string} userId - The user joining the room
 */
export const joinCallRoom = async (roomId, userId) => {
    try {
        // First, check if the room exists
        const { data: room, error: fetchError } = await supabase
            .from(SUPABASE_CONFIG.ROOMS_TABLE)
            .select('*')
            .eq('id', roomId)
            .single()

        if (fetchError || !room) {
            throw new Error('Room not found')
        }

        // Update the room to show that someone has joined
        const { error: updateError } = await supabase
            .from(SUPABASE_CONFIG.ROOMS_TABLE)
            .update({
                participant_id: userId,
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('id', roomId)

        if (updateError) {
            throw new Error(`Failed to join room: ${updateError.message}`)
        }

        console.log(`Joined call room: ${roomId}`)
        return room
    } catch (error) {
        console.error('Error in joinCallRoom:', error)
        throw error
    }
}

/**
 * Cleans up signaling messages for a room
 * This prevents the database from accumulating old messages
 * @param {string} roomId - The room to clean up
 */
export const cleanupSignalingMessages = async (roomId) => {
    try {
        const { error } = await supabase
            .from(SUPABASE_CONFIG.SIGNALING_TABLE)
            .delete()
            .eq('room_id', roomId)

        if (error) {
            console.error('Failed to cleanup signaling messages:', error)
        } else {
            console.log(`Cleaned up signaling messages for room: ${roomId}`)
        }
    } catch (error) {
        console.error('Error in cleanupSignalingMessages:', error)
    }
}

/**
 * Ends a call room and cleans up associated data
 * @param {string} roomId - The room to end
 */
export const endCallRoom = async (roomId) => {
    try {
        // Update room status to ended
        await supabase
            .from(SUPABASE_CONFIG.ROOMS_TABLE)
            .update({
                status: 'ended',
                ended_at: new Date().toISOString()
            })
            .eq('id', roomId)

        // Clean up signaling messages
        await cleanupSignalingMessages(roomId)

        console.log(`Ended call room: ${roomId}`)
    } catch (error) {
        console.error('Error in endCallRoom:', error)
        throw error
    }
}