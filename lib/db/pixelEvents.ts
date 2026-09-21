/**
 * Durable ledger of every ad-platform event RAPID fires (Supabase Postgres —
 * see sql/pixel_events.sql). Server-only. Each row is one platform event from
 * one source: 'browser' rows are what the visitor's pixel reported doing,
 * 'server' rows are the outcome of our Conversions API call for the same
 * event_id. Comparing the two, and comparing our counts with what Meta and
 * Reddit report, is how we find where conversions are being lost.
 */
import { getSupabase } from '../supabase';
import type { LogicalEvent, PixelPlatform } from '../pixelEvents';

export interface PixelEventRow {
  event_id: string;
  logical_event: LogicalEvent;
  platform: PixelPlatform;
  platform_event: string;
  source: 'browser' | 'server';
  status: string;
  error?: string | null;
  page_path?: string | null;
  channel?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  product_id?: string | null;
  user_id?: string | null;
  params?: Record<string, unknown> | null;
}

export interface PixelEventRecord extends PixelEventRow {
  created_at: string;
}

export async function logPixelEvents(rows: PixelEventRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await getSupabase().from('pixel_events').insert(rows);
  if (error) throw error;
}

// PostgREST caps a single response at 1000 rows by default, so page through.
const PAGE_SIZE = 1000;
const MAX_ROWS = 20000;

export async function fetchPixelEventsSince(sinceIso: string): Promise<{ rows: PixelEventRecord[]; truncated: boolean }> {
  const supabase = getSupabase();
  const rows: PixelEventRecord[] = [];

  for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('pixel_events')
      .select('*')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as PixelEventRecord[]));
    if (!data || data.length < PAGE_SIZE) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}

export interface PixelEventSummary {
  /** One line per (logical event, platform, platform event) with browser and server outcome counts. */
  events: Array<{
    logicalEvent: string;
    platform: string;
    platformEvent: string;
    browser: { sent: number; queued: number; missing: number; error: number };
    server: { success: number; error: number; skipped: number };
  }>;
  /**
   * Distinct actions per page, and how many of those the browser reported
   * firing to each platform — a page where one platform is far below the other
   * has a coverage gap.
   */
  byPage: Array<{ logicalEvent: string; page: string; actions: number; meta: number; reddit: number }>;
  byChannel: Array<{ logicalEvent: string; channel: string; actions: number }>;
  recentErrors: Array<{ createdAt: string; platform: string; platformEvent: string; page: string; error: string }>;
  /** One entry per distinct action (event_id) with its first timestamp — lets a client bucket a timeline in its own timezone. */
  actions: Array<{ t: string; logicalEvent: string }>;
  /** The newest actions with every platform fire attached, to check a test click end to end. */
  recentActions: Array<{
    eventId: string;
    createdAt: string;
    logicalEvent: string;
    page: string;
    channel: string;
    fires: Array<{ platform: string; platformEvent: string; source: string; status: string; error?: string }>;
  }>;
}

export function summarizePixelEvents(rows: PixelEventRecord[]): PixelEventSummary {
  const events = new Map<string, PixelEventSummary['events'][number]>();
  const pages = new Map<string, { logicalEvent: string; page: string; all: Set<string>; meta: Set<string>; reddit: Set<string> }>();
  const channels = new Map<string, { logicalEvent: string; channel: string; all: Set<string> }>();
  const recentErrors: PixelEventSummary['recentErrors'] = [];
  const actions = new Map<string, PixelEventSummary['recentActions'][number]>();

  for (const row of rows) {
    let action = actions.get(row.event_id);
    if (!action) {
      action = {
        eventId: row.event_id,
        createdAt: row.created_at,
        logicalEvent: row.logical_event,
        page: row.page_path || '(unknown)',
        channel: row.channel || 'direct / organic',
        fires: [],
      };
      actions.set(row.event_id, action);
    }
    if (row.created_at < action.createdAt) action.createdAt = row.created_at;
    action.fires.push({
      platform: row.platform,
      platformEvent: row.platform_event,
      source: row.source,
      status: row.status,
      ...(row.error ? { error: row.error } : {}),
    });

    const eventKey = `${row.logical_event}|${row.platform}|${row.platform_event}`;
    let entry = events.get(eventKey);
    if (!entry) {
      entry = {
        logicalEvent: row.logical_event,
        platform: row.platform,
        platformEvent: row.platform_event,
        browser: { sent: 0, queued: 0, missing: 0, error: 0 },
        server: { success: 0, error: 0, skipped: 0 },
      };
      events.set(eventKey, entry);
    }
    const bucket = (row.source === 'browser' ? entry.browser : entry.server) as Record<string, number>;
    if (row.status in bucket) bucket[row.status] += 1;

    const page = row.page_path || '(unknown)';
    const pageKey = `${row.logical_event}|${page}`;
    let pageEntry = pages.get(pageKey);
    if (!pageEntry) {
      pageEntry = { logicalEvent: row.logical_event, page, all: new Set(), meta: new Set(), reddit: new Set() };
      pages.set(pageKey, pageEntry);
    }
    pageEntry.all.add(row.event_id);
    if (row.source === 'browser' && row.status !== 'missing') {
      (row.platform === 'meta' ? pageEntry.meta : pageEntry.reddit).add(row.event_id);
    }

    const channel = row.channel || 'direct / organic';
    const channelKey = `${row.logical_event}|${channel}`;
    let channelEntry = channels.get(channelKey);
    if (!channelEntry) {
      channelEntry = { logicalEvent: row.logical_event, channel, all: new Set() };
      channels.set(channelKey, channelEntry);
    }
    channelEntry.all.add(row.event_id);

    if (row.source === 'server' && row.status === 'error' && recentErrors.length < 25) {
      recentErrors.push({
        createdAt: row.created_at,
        platform: row.platform,
        platformEvent: row.platform_event,
        page,
        error: row.error || 'unknown',
      });
    }
  }

  return {
    events: Array.from(events.values()).sort((a, b) =>
      `${a.logicalEvent}|${a.platform}|${a.platformEvent}`.localeCompare(`${b.logicalEvent}|${b.platform}|${b.platformEvent}`)
    ),
    byPage: Array.from(pages.values())
      .map((p) => ({ logicalEvent: p.logicalEvent, page: p.page, actions: p.all.size, meta: p.meta.size, reddit: p.reddit.size }))
      .sort((a, b) => b.actions - a.actions),
    byChannel: Array.from(channels.values())
      .map((c) => ({ logicalEvent: c.logicalEvent, channel: c.channel, actions: c.all.size }))
      .sort((a, b) => b.actions - a.actions),
    recentErrors,
    actions: Array.from(actions.values()).map((a) => ({ t: a.createdAt, logicalEvent: a.logicalEvent })),
    recentActions: Array.from(actions.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 25)
      .map((a) => ({
        ...a,
        fires: a.fires.sort((x, y) =>
          `${x.platform}|${x.platformEvent}|${x.source}`.localeCompare(`${y.platform}|${y.platformEvent}|${y.source}`)
        ),
      })),
  };
}
