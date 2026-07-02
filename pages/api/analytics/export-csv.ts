import type { NextApiRequest, NextApiResponse } from 'next';
import { exportEmails } from '../../../lib/db/analytics';

/**
 * Rate limiting store (simple in-memory, OK for single instance)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string, maxRequests: number = 1, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientId);

  if (!record || now > record.resetTime) {
    // New window or expired
    rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count < maxRequests) {
    record.count++;
    return true;
  }

  return false;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get client identifier (IP address)
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';

    // Check rate limit: 1 request per minute per IP
    if (!checkRateLimit(clientIp, 1, 60000)) {
      return res.status(429).json({
        error: 'Too many requests. Maximum 1 CSV download per minute.',
      });
    }

    // Parse query parameters
    const daysBack = parseInt(req.query.daysBack as string, 10) || 30;
    const source = (req.query.source as 'website' | 'facebook-lead' | 'all') || 'all';
    const statusOnly = (req.query.status as 'success' | 'duplicate' | 'all') || 'success';

    // Validate parameters
    if (daysBack < 1 || daysBack > 365) {
      return res.status(400).json({
        error: 'daysBack must be between 1 and 365',
      });
    }

    if (!['website', 'facebook-lead', 'all'].includes(source)) {
      return res.status(400).json({
        error: 'source must be "website", "facebook-lead", or "all"',
      });
    }

    if (!['success', 'duplicate', 'all'].includes(statusOnly)) {
      return res.status(400).json({
        error: 'status must be "success", "duplicate", or "all"',
      });
    }

    // Export emails from database
    const emails = exportEmails({
      daysBack,
      source,
      statusOnly,
    });

    // Build CSV content
    const csvContent = ['Email Address', ...emails].join('\n');

    // Set response headers
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `rapid-signups-${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    console.log(`📊 CSV export: ${emails.length} emails (${source}, ${statusOnly}, last ${daysBack} days)`);

    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    return res.status(500).json({
      error: 'Failed to export CSV',
    });
  }
}
