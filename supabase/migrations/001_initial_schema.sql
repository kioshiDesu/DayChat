-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create rooms table
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  is_public BOOLEAN NOT NULL DEFAULT true,
  invite_code VARCHAR(6) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content VARCHAR(500) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reports table
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_rooms_expires_at ON rooms(expires_at);
CREATE INDEX idx_rooms_public_expires ON rooms(is_public, expires_at) WHERE is_public = true;
CREATE INDEX idx_messages_room_expires ON messages(room_id, expires_at);
CREATE INDEX idx_messages_expires_at ON messages(expires_at);
CREATE INDEX idx_reports_message ON reports(message_id);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Rooms policies
CREATE POLICY "Public rooms are viewable by all" ON rooms FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert their own rooms" ON rooms FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can view rooms they have access to" ON rooms FOR SELECT USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM messages WHERE messages.room_id = rooms.id AND messages.user_id = auth.uid()));
CREATE POLICY "Users can delete their own rooms" ON rooms FOR DELETE USING (auth.uid() = creator_id);

-- Messages policies
CREATE POLICY "Users can view messages in accessible rooms" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM rooms WHERE rooms.id = messages.room_id AND (rooms.is_public = true OR rooms.creator_id = auth.uid())));
CREATE POLICY "Users can insert messages in accessible rooms" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM rooms WHERE rooms.id = messages.room_id AND (rooms.is_public = true OR rooms.creator_id = auth.uid())));
CREATE POLICY "Room creators can delete any message" ON messages FOR DELETE USING (EXISTS (SELECT 1 FROM rooms WHERE rooms.id = messages.room_id AND rooms.creator_id = auth.uid()));
CREATE POLICY "Users can delete their own messages" ON messages FOR DELETE USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Authenticated users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS TEXT AS $$
DECLARE code TEXT; exists BOOLEAN; BEGIN
  LOOP
    code := UPPER(substring(md5(random()::text) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM rooms WHERE invite_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;
