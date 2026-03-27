-- Enable pg_cron extension (run in Supabase dashboard first)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_data() RETURNS void AS $$
BEGIN
  DELETE FROM reports WHERE message_id IN (SELECT id FROM messages WHERE expires_at < now());
  DELETE FROM messages WHERE expires_at < now();
  DELETE FROM rooms WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Schedule hourly cleanup
SELECT cron.schedule('cleanup-expired-data', '0 * * * *', $$SELECT cleanup_expired_data()$$);
