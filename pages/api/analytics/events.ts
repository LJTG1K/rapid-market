import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface SignupEvent {
  timestamp: string;
  source: 'website' | 'facebook-lead';
  email: string;
  status: 'success' | 'duplicate' | 'error';
  userId?: string;
  errorCode?: number;
  errorMsg?: string;
}

interface AnalyticsResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

const ANALYTICS_FILE = path.join(process.cwd(), '.data', 'analytics.jsonl');

// Ensure .data directory exists
function ensureDataDir() {
  const dir = path.join(process.cwd(), '.data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyticsResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    ensureDataDir();
    
    const event: SignupEvent = req.body;

    // Validate event
    if (!event.timestamp || !event.source || !event.email || !event.status) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: timestamp, source, email, status',
      });
    }

    // Append to JSONL file (one JSON object per line)
    const eventLine = JSON.stringify(event) + '\n';
    fs.appendFileSync(ANALYTICS_FILE, eventLine);

    console.log(`📊 Analytics event logged: ${event.source} | ${event.email} | ${event.status}`);

    return res.status(200).json({ ok: true, message: 'Event recorded' });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Internal error',
    });
  }
}
