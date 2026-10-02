import type { NextApiRequest, NextApiResponse } from 'next';
import { UserError } from './service';

type Handler = (req: NextApiRequest, res: NextApiResponse, editor: string) => Promise<unknown>;

/**
 * Wraps an API route: method allow-list, editor name from the
 * x-studio-editor header (honour system, see SPEC.md), and uniform errors.
 * Auth itself is enforced by middleware.ts before the route runs.
 */
export function route(handlers: Partial<Record<'GET' | 'POST' | 'PUT' | 'DELETE', Handler>>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const handler = handlers[req.method as keyof typeof handlers];
    if (!handler) return res.status(405).json({ error: 'Method not allowed' });
    const raw = req.headers['x-studio-editor'];
    const editor = (decodeURIComponent(Array.isArray(raw) ? raw[0] : raw ?? '') || 'Unknown').slice(0, 60);
    try {
      const body = await handler(req, res, editor);
      if (!res.headersSent) res.status(200).json(body ?? { ok: true });
    } catch (e) {
      const status = e instanceof UserError ? e.status : 500;
      if (status === 500) console.error('[studio]', e);
      res.status(status).json({ error: (e as Error).message || 'Something went wrong' });
    }
  };
}
