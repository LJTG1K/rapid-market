import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabase } from '../../../lib/supabase';
import { hashEmail } from '../../../lib/metaConversions';

/**
 * Exports Meta Custom Audience-ready CSVs (SHA-256 hashed emails) built from
 * the durable Supabase data — NOT lib/db/analytics.ts, which is SQLite
 * written to /tmp on Vercel and doesn't survive across serverless instances.
 *
 * GET /api/admin/export-audiences?list=qualified&key=<ADMIN_PASSWORD>
 * GET /api/admin/export-audiences?list=all&key=<ADMIN_PASSWORD>
 *
 * "qualified" = users with a behavior_events row for the ClickToSugargoo
 * click-through (logged as event_type 'sugargoo_click', see
 * lib/db/behaviorEvents.ts + pages/api/track.ts) or the QualifiedLead
 * signup->tutorial sequence (event_type 'qualified_lead').
 * "all" = every signup, for baseline comparison.
 */

const QUALIFYING_EVENT_TYPES = ['sugargoo_click', 'qualified_lead'];
const PAGE_SIZE = 1000;

async function fetchAllRows<T>(
  table: string,
  select: string,
  filterIn?: { column: string; values: string[] }
): Promise<T[]> {
  const supabase = getSupabase();
  const rows: T[] = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (filterIn) query = query.in(filterIn.column, filterIn.values);

    const { data, error } = await query;
    if (error) throw error;

    rows.push(...((data as T[]) ?? []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function getAllSignupEmails(): Promise<string[]> {
  const rows = await fetchAllRows<{ email: string }>('users', 'email');
  return rows.map((r) => r.email);
}

async function getQualifiedEmails(): Promise<string[]> {
  const events = await fetchAllRows<{ user_id: string }>('behavior_events', 'user_id', {
    column: 'event_type',
    values: QUALIFYING_EVENT_TYPES,
  });
  const userIds = Array.from(new Set(events.map((e) => e.user_id)));
  if (userIds.length === 0) return [];

  const users = await fetchAllRows<{ email: string }>('users', 'email', {
    column: 'id',
    values: userIds,
  });
  return users.map((u) => u.email);
}

function buildCsv(emails: string[]): string {
  return ['email', ...emails.map(hashEmail)].join('\n');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  if (req.query.key !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const list = req.query.list;
  if (list !== 'qualified' && list !== 'all') {
    return res.status(400).json({ error: 'list must be "qualified" or "all"' });
  }

  try {
    const emails = list === 'qualified' ? await getQualifiedEmails() : await getAllSignupEmails();
    const csvContent = buildCsv(emails);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `rapid-audience-${list}-${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    console.log(`📊 Audience export: ${emails.length} emails (${list})`);

    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Audience export error:', error);
    return res.status(500).json({ error: 'Failed to export audience CSV' });
  }
}
