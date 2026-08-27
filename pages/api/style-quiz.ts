import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserIdFromRequest } from '../../lib/auth/session';
import { getStyleQuizResponse, saveStyleQuizResponse, type StyleQuizRow } from '../../lib/auth/users';

interface StyleQuizApiResponse {
  response?: StyleQuizRow | null;
  saved?: boolean;
  error?: string;
}

/**
 * Unlike wishlist.ts, this endpoint does NOT require a session — the quiz and
 * its results page work fully from localStorage for anonymous visitors (see
 * lib/styleQuizStorage.ts). When a session does exist, GET/POST additionally
 * read/write Supabase so answers survive a device change. A logged-out POST
 * is a silent no-op rather than a 401, so the client never has to branch on
 * auth state before saving.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StyleQuizApiResponse>
) {
  const userId = getUserIdFromRequest(req);

  try {
    if (req.method === 'GET') {
      if (!userId) return res.status(200).json({ response: null });
      const response = await getStyleQuizResponse(userId);
      return res.status(200).json({ response });
    }

    if (req.method === 'POST') {
      if (!userId) return res.status(200).json({ saved: false });

      const { styles, budget, fit } = req.body as { styles?: string[]; budget?: string; fit?: string };
      if (!Array.isArray(styles) || styles.length === 0 || !budget || !fit) {
        return res.status(400).json({ error: 'styles, budget and fit are required' });
      }

      await saveStyleQuizResponse(userId, { styles, budget, fit });
      return res.status(200).json({ saved: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Style quiz error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
