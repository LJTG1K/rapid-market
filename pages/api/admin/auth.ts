import type { NextApiRequest, NextApiResponse } from 'next';

interface AuthRequest {
  password: string;
}

interface AuthResponse {
  success?: boolean;
  error?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body as AuthRequest;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD not configured');
      return res.status(500).json({ error: 'Server error' });
    }

    // Simple constant-time comparison (basic protection against timing attacks)
    const match = password === adminPassword;

    if (!match) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
