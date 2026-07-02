import type { NextApiRequest, NextApiResponse } from 'next';
import { exportEmails } from '../../../lib/db/analytics';
import Database from 'better-sqlite3';
import path from 'path';

interface EmailsResponse {
  emails?: string[];
  csv?: string;
  count?: number;
  error?: string;
  success?: boolean;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmailsResponse>
) {
  try {
    if (req.method === 'GET') {
      // Return all unique successful emails as JSON
      const emails = exportEmails({ statusOnly: 'success' });
      
      return res.status(200).json({
        emails,
        count: emails.length,
      });
    }

    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'download') {
        // Return CSV
        const emails = exportEmails({ statusOnly: 'success' });
        const csv = 'Email\n' + emails.map(e => `"${e}"`).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="signup-emails.csv"');
        return res.status(200).end(csv);
      }

      if (action === 'clear') {
        // Clear all successful signup records from database
        const dataDir = path.join(process.cwd(), '.data');
        const dbPath = path.join(dataDir, 'analytics.db');
        
        const db = new Database(dbPath);
        const stmt = db.prepare('DELETE FROM signup_events WHERE status = ? AND source = ?');
        const result = stmt.run('success', 'website');
        
        db.close();

        console.log(`🗑️  Cleared ${result.changes} signup records`);

        return res.status(200).json({
          success: true,
          count: result.changes,
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin emails error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
}
