## Supabase Setup Instructions

1. Go to Supabase Dashboard → Database → Extensions
2. Enable `pg_cron` extension
3. Go to SQL Editor
4. Run the migration files in order:
   - `migrations/001_initial_schema.sql`
   - `migrations/002_cleanup_job.sql`
5. Verify cron job: `SELECT * FROM cron.job;`
