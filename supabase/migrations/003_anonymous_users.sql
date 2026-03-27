-- Add anonymous user columns
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS creator_anon_id text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_anon_id text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS display_name text;

-- Migrate existing data
UPDATE rooms SET creator_anon_id = 'migrated-' || creator_id::text WHERE creator_anon_id IS NULL;
UPDATE messages SET user_anon_id = 'migrated-' || user_id::text WHERE user_anon_id IS NULL;
UPDATE messages SET display_name = 'Anonymous' WHERE display_name IS NULL;

-- Make columns NOT NULL
ALTER TABLE rooms ALTER COLUMN creator_anon_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN user_anon_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN display_name SET NOT NULL;

-- Drop old foreign key constraints
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_creator_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;

-- New RLS policies for anonymous users
DROP POLICY IF EXISTS "Users can insert their own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view rooms they have access to" ON rooms;
DROP POLICY IF EXISTS "Users can delete their own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in accessible rooms" ON messages;
DROP POLICY IF EXISTS "Room creators can delete any message" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public rooms are viewable by all" ON rooms FOR SELECT USING (is_public = true);
CREATE POLICY "Creators can delete their rooms" ON rooms FOR DELETE USING (creator_anon_id = current_setting('app.current_anon_id', true));
CREATE POLICY "Anyone can send messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view messages in public rooms" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM rooms WHERE rooms.id = messages.room_id AND rooms.is_public = true));
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (user_anon_id = current_setting('app.current_anon_id', true));
CREATE POLICY "Creators can delete messages in their rooms" ON messages FOR DELETE USING (EXISTS (SELECT 1 FROM rooms WHERE rooms.id = messages.room_id AND rooms.creator_anon_id = current_setting('app.current_anon_id', true)));
