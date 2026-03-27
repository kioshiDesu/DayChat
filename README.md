# DayChat v2

Anonymous, ephemeral community rooms that last 24 hours. No auth required.

## Features

- 🔐 **Anonymous** - No email, no password, auto-generated identity
- ⏰ **Ephemeral** - Rooms and messages expire after 24 hours
- 💾 **Local Persistence** - Expired messages stay in your browser
- 🎨 **Visual Expiry** - Clear countdown timers and expiry indicators

## Setup

1. Run migrations in Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_cleanup_job.sql`
   - `supabase/migrations/003_anonymous_users.sql`

2. Enable pg_cron in Supabase Dashboard → Database → Extensions

3. Run `npm install`

4. Run `npm run dev`

## First Time Use

1. Visit the app
2. Get assigned an anonymous ID (e.g., "Swift Tiger-7k9m")
3. Optionally set a display name
4. Start chatting!

## How It Works

- **Identity**: Stored locally in your browser (IndexedDB)
- **Messages**: Synced to Supabase + cached locally
- **Expiry**: Messages expire after 24h from server, but stay in your browser
- **Cleanup**: pg_cron runs hourly to delete expired data
