/**
 * Local pixel-event dashboard: `npm run dashboard` (add `-- --demo` for sample data).
 *
 * Reads the Supabase `pixel_events` ledger directly with the service-role key
 * from .env.local, and serves a single page on http://127.0.0.1:4100. It runs
 * only on this machine — bound to loopback, never deployed — so the key stays
 * in this process and is never sent to the browser or to the website.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import {
  fetchPixelEventsSince,
  summarizePixelEvents,
  type PixelEventRecord,
} from '../../lib/db/pixelEvents';

const PORT = Number(process.env.PORT) || 4100;
const HOST = '127.0.0.1';
const MAX_HOURS = 24 * 90;
const DEMO = process.argv.includes('--demo');

/** Minimal .env parser — enough for the KEY=value lines in .env.local. */
function loadEnvFile(file: string): void {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadEnvFile(path.resolve(process.cwd(), '.env.local'));

/** Plausible fake ledger rows, including a Meta coverage gap and some blocked pixels, to preview the UI. */
function demoRows(hours: number): PixelEventRecord[] {
  const rows: PixelEventRecord[] = [];
  const now = Date.now();
  const pages = ['/product/[id]', '/brands/[slug]', '/fashion-listings/[slug]', '/account', '/style-quiz'];
  const channels = ['reddit', 'meta', null, null, 'reddit'];
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const count = Math.min(900, Math.round(hours * 9));

  for (let i = 0; i < count; i++) {
    const at = new Date(now - rand() * hours * 3600_000).toISOString();
    const quiz = rand() < 0.3;
    const page = quiz ? '/style-quiz' : pages[Math.floor(rand() * 4)];
    const channel = channels[Math.floor(rand() * channels.length)];
    const eventId = `demo-${i.toString().padStart(6, '0')}`;
    const blocked = rand() < 0.12;
    const planned = quiz
      ? [['meta', 'QuizComplete'], ['reddit', 'Lead'], ['reddit', 'QuizComplete_Streetwear']]
      : [['meta', 'ClickToSugargoo'], ['reddit', 'AddToCart'], ['reddit', 'SugargooBuyClick']];
    for (const [platform, name] of planned) {
      // Demo gap: /account never fired Meta before the fix, so show it missing here.
      const metaGap = platform === 'meta' && page === '/account';
      if (!metaGap) {
        rows.push({
          created_at: at, event_id: eventId, logical_event: quiz ? 'quiz_complete' : 'buy_click',
          platform, platform_event: name, source: 'browser', status: blocked ? 'queued' : 'sent',
          page_path: page, channel,
        } as PixelEventRecord);
      }
      const err = platform === 'meta' && rand() < 0.04;
      rows.push({
        created_at: at, event_id: eventId, logical_event: quiz ? 'quiz_complete' : 'buy_click',
        platform, platform_event: name, source: 'server',
        status: err ? 'error' : rand() < 0.02 ? 'skipped' : 'success',
        error: err ? 'Invalid OAuth access token' : null, page_path: page, channel,
      } as PixelEventRecord);
    }
  }
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return void res.end(html);
  }

  if (url.pathname === '/api/summary') {
    const requested = Number(url.searchParams.get('hours'));
    const hours = Number.isFinite(requested) && requested > 0 ? Math.min(requested, MAX_HOURS) : 24;
    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    try {
      const { rows, truncated } = DEMO
        ? { rows: demoRows(hours), truncated: false }
        : await fetchPixelEventsSince(since);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return void res.end(
        JSON.stringify({ hours, since, demo: DEMO, totalRows: rows.length, truncated, ...summarizePixelEvents(rows) })
      );
    } catch (error: any) {
      const missingTable = error?.code === 'PGRST205';
      const message = missingTable
        ? "The pixel_events table doesn't exist yet — run sql/pixel_events.sql in the Supabase SQL editor."
        : error?.message || 'Failed to read the ledger.';
      console.error('Ledger read failed:', error?.message || error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return void res.end(JSON.stringify({ error: message }));
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`\nPixel dashboard${DEMO ? ' (DEMO DATA)' : ''}: http://${HOST}:${PORT}\n`);
  if (!DEMO && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not found in .env.local — reads will fail.\n');
  }
});
