import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * Test endpoint to log all requests
 * No authentication, just logging
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log request to file
  const logDir = path.join(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'webhook-test.log');

  // Create logs directory if needed
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
  };

  // Append to log file
  fs.appendFileSync(logFile, JSON.stringify(logEntry, null, 2) + '\n\n');

  console.log('📝 Test webhook logged:', JSON.stringify(logEntry, null, 2));

  return res.status(200).json({
    success: true,
    logged: true,
    timestamp,
  });
}
