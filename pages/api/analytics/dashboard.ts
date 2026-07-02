import type { NextApiRequest, NextApiResponse } from 'next';
import { getDashboardStats } from '../../../lib/db/analytics';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = getDashboardStats();
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({
      error: 'Failed to fetch dashboard stats',
    });
  }
}
