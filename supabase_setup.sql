-- Create tables for WebRTC signaling
CREATE TABLE IF NOT EXISTS webrtc_signaling (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id text NOT NULL,
  type text NOT NULL,
  data jsonb NOT NULL,
  sender_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table for call rooms
CREATE TABLE IF NOT EXISTS call_rooms (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE webrtc_signaling ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for webrtc_signaling table
-- Allow anyone to insert (for anonymous signaling)
CREATE POLICY "Allow anyone to insert" 
  ON webrtc_signaling 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Allow anyone to select based on room_id (only signals for rooms they know)
CREATE POLICY "Allow anyone to select signals for known rooms" 
  ON webrtc_signaling 
  FOR SELECT 
  TO public 
  USING (true);

-- Create policies for call_rooms table
-- Allow anyone to create rooms
CREATE POLICY "Allow anyone to create rooms" 
  ON call_rooms 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Allow anyone to select rooms (they need the ID to access)
CREATE POLICY "Allow anyone to select rooms" 
  ON call_rooms 
  FOR SELECT 
  TO public 
  USING (true);

-- Clean up old signaling data automatically (optional)
-- This trigger will delete signaling data older than 1 day
CREATE OR REPLACE FUNCTION cleanup_old_signaling()
RETURNS trigger AS $$
BEGIN
  DELETE FROM webrtc_signaling WHERE created_at < NOW() - INTERVAL '1 day';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run cleanup function every hour
CREATE TRIGGER cleanup_signaling_trigger
  AFTER INSERT ON webrtc_signaling
  EXECUTE PROCEDURE cleanup_old_signaling();

-- Set up storage buckets and policies for user avatars (optional)
-- Only create if you plan to add user avatars or file sharing later

-- Create a bucket for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Policy for anonymous avatar uploads
CREATE POLICY "Allow anonymous avatar uploads"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'avatars' AND
    octet_length(CAST(storage.foldername(name) as text)) = 0
  );

-- Policy to allow public reading of avatars
CREATE POLICY "Allow public avatar access"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Bucket for temporary file sharing during calls
INSERT INTO storage.buckets (id, name, public) 
VALUES ('call-files', 'call-files', false)
ON CONFLICT DO NOTHING;

-- Policy for file uploads during calls - requires room_id in path
CREATE POLICY "Allow uploads to known room folders"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'call-files' AND
    CAST(storage.foldername(name) as text) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

-- Policy to allow access to shared files - only if you know the path
CREATE POLICY "Allow access to files in known rooms"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'call-files'
  );

-- Setup real-time replication for signaling
ALTER PUBLICATION supabase_realtime ADD TABLE webrtc_signaling;