import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserIdFromRequest } from '../../../lib/auth/session';
import { findUserById, toPublicUser, type PublicUser } from '../../../lib/auth/users';

interface MeResponse {
  user: PublicUser | null;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MeResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ user: null, error: 'Method not allowed' });
  }

  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(200).json({ user: null });
    }

    const user = await findUserById(userId);
    return res.status(200).json({ user: user ? toPublicUser(user) : null });
  } catch (error) {
    console.error('Auth /me error:', error);
    // Fail closed as logged-out rather than 500 — this runs on every page load.
    return res.status(200).json({ user: null });
  }
}
