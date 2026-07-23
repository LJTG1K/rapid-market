/**
 * Server-only Supabase client (service-role).
 *
 * All persistent-account and wishlist data lives in Supabase Postgres, NOT in
 * the SQLite file used by lib/db/analytics.ts — that DB writes to /tmp on Vercel
 * and is ephemeral per serverless instance, which is fine for best-effort
 * analytics but unusable for durable user accounts.
 *
 * This module uses the SERVICE-ROLE key and must therefore never be imported by
 * client-side code. Every DB access happens through our own API routes, so the
 * browser never talks to Supabase directly and the service-role key never ships
 * to the browser bundle. Lazy singleton, mirroring getDatabase() in
 * lib/db/analytics.ts.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
