import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserIdFromRequest } from '../../lib/auth/session';
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  type WishlistRow,
} from '../../lib/auth/users';

interface WishlistResponse {
  items?: WishlistRow[];
  success?: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WishlistResponse>
) {
  // Every method requires a valid session — closes the server-side auth gap the
  // admin routes left open.
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    if (req.method === 'GET') {
      const items = await getWishlist(userId);
      return res.status(200).json({ items });
    }

    if (req.method === 'POST' || req.method === 'DELETE') {
      const { productId, category } = req.body as {
        productId?: string;
        category?: string;
      };

      if (!productId || !category) {
        return res.status(400).json({ error: 'productId and category are required' });
      }

      if (req.method === 'POST') {
        await addWishlistItem(userId, productId, category);
      } else {
        await removeWishlistItem(userId, productId, category);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Wishlist error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
