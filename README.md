# Tracking SoF Equipment Inventory

This is a Next.js app that can read equipment data from Supabase. The project
previously used a CSV/JSON fallback; it's been moved to use Supabase as the
primary data source for Vercel deployments.

Quick notes for deploying to Vercel with Supabase:

- Set these environment variables in your Vercel project settings (don't
	commit them to the repo):
	- SUPABASE_URL — your Supabase project URL
	- SUPABASE_ANON_KEY (optional) — anon key (used as fallback)
	- SUPABASE_SERVICE_ROLE_KEY — recommended for server-side database writes

- Server pages call `getInventoryItems()` from `src/lib/data.server.ts` which
	uses the server-side Supabase client. Client code that updates items calls
	APIs which in turn write to Supabase.

To get started locally, set the same env vars in a `.env.local` file (Vercel
and Next.js will pick them up during build/runtime):

```
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

See `src/lib/supabase.ts` for the client creation logic.
