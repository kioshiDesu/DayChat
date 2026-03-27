# DayChat

Ephemeral community rooms that last 24 hours.

## Setup

1. Create a Supabase project
2. Run migrations in `supabase/migrations/`
3. Enable pg_cron extension in Supabase dashboard
4. Copy `.env.example` to `.env.local` and fill in values
5. Run `npm install`
6. Run `npm run dev`

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Supabase Setup

### 1. Enable pg_cron Extension

In Supabase Dashboard → Database → Extensions, enable **pg_cron**.

### 2. Run Migrations

In Supabase SQL Editor, run the migration files in order:

1. `supabase/migrations/001_initial_schema.sql` - Creates tables, indexes, RLS policies
2. `supabase/migrations/002_cleanup_job.sql` - Creates cleanup function and schedules hourly cron job

### 3. Verify Setup

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Verify cron job is scheduled
SELECT * FROM cron.job;

-- Test cleanup function
SELECT cleanup_expired_data();
```

## How It Works

- **Rooms** expire after 24 hours (or custom duration)
- **Messages** expire 24 hours after being posted
- **pg_cron** runs hourly to delete expired data
- **Real-time** updates via Supabase Realtime subscriptions
