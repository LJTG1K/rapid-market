import { NextApiRequest, NextApiResponse } from 'next';

interface TokenResponse {
  code: number;
  msg: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    refreshExpiresIn: number;
    accessTokenExpiresAt: number;
    refreshTokenExpiresAt: number;
  };
}

interface CachedToken {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

// In-memory token cache (in production, use Redis or database)
let cachedToken: CachedToken | null = null;

const SUGARGOO_BASE_URL = process.env.SUGARGOO_API_BASE_URL || 'https://www.sugargootest.com/api/opencenter';
const API_USERNAME = process.env.SUGARGOO_API_USERNAME || '';
const API_PASSWORD = process.env.SUGARGOO_API_PASSWORD || '';

/**
 * Get or refresh access token from Sugargoo
 * Handles token caching and automatic refresh
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Check if we have a cached token that's still valid
  if (cachedToken && cachedToken.accessTokenExpiresAt > now + 60000) {
    // Token is valid for at least 1 more minute, use it
    return cachedToken.accessToken;
  }

  // Check if we can refresh the token
  if (cachedToken && cachedToken.refreshTokenExpiresAt > now) {
    try {
      console.log('[Sugargoo] Refreshing access token...');
      const refreshed = await refreshAccessToken(cachedToken.refreshToken);
      return refreshed;
    } catch (error) {
      console.error('[Sugargoo] Token refresh failed, attempting fresh login:', error);
      // Fall through to fresh login
    }
  }

  // Need fresh login
  try {
    console.log('[Sugargoo] Obtaining fresh access token...');
    const token = await freshLogin();
    return token;
  } catch (error) {
    console.error('[Sugargoo] Fresh login failed:', error);
    throw new Error('Failed to obtain Sugargoo access token');
  }
}

/**
 * Fresh login with username/password
 */
async function freshLogin(): Promise<string> {
  const url = `${SUGARGOO_BASE_URL}/t-api/open/auth/token`;
  
  console.log(`[Sugargoo Auth] Logging in with username: ${API_USERNAME}`);
  console.log(`[Sugargoo Auth] URL: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: API_USERNAME,
      password: API_PASSWORD,
    }),
  });

  console.log(`[Sugargoo Auth] Response status: ${response.status}`);
  const data: TokenResponse = await response.json();
  console.log(`[Sugargoo Auth] Full response:`, JSON.stringify(data));

  if (data.code !== 200 || !data.data) {
    console.error(`[Sugargoo Auth] Auth failed with code ${data.code}: ${data.msg}`);
    throw new Error(`Sugargoo auth failed: ${data.msg}`);
  }

  // Cache the token
  cachedToken = {
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
    accessTokenExpiresAt: data.data.accessTokenExpiresAt,
    refreshTokenExpiresAt: data.data.refreshTokenExpiresAt,
  };

  console.log(
    `[Sugargoo Auth] Fresh token obtained successfully. Expires at: ${new Date(data.data.accessTokenExpiresAt).toISOString()}`
  );

  return data.data.accessToken;
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const url = `${SUGARGOO_BASE_URL}/t-api/open/auth/refresh`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  const data: TokenResponse = await response.json();
  console.log(`[Sugargoo Auth] Refresh response: code=${data.code}, msg=${data.msg}`);

  if (data.code !== 200 || !data.data) {
    throw new Error(`Sugargoo refresh failed: ${data.msg}`);
  }

  // Update cached token
  cachedToken = {
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
    accessTokenExpiresAt: data.data.accessTokenExpiresAt,
    refreshTokenExpiresAt: data.data.refreshTokenExpiresAt,
  };

  console.log(
    `[Sugargoo] Token refreshed. Expires at: ${new Date(data.data.accessTokenExpiresAt).toISOString()}`
  );

  return data.data.accessToken;
}

/**
 * API endpoint: POST /api/sugargoo/auth/token
 * Returns current valid access token (with caching/refresh)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accessToken = await getAccessToken();

    return res.status(200).json({
      ok: true,
      accessToken,
      expiresAt: cachedToken?.accessTokenExpiresAt,
    });
  } catch (error) {
    console.error('[Sugargoo] Token retrieval failed:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to obtain Sugargoo access token',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

// Export getAccessToken for use in other endpoints
export { getAccessToken };
