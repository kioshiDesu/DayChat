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

In Supabase SQL Editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

Then run the migration files in order.
