/**
 * Sugargoo Token Manager
 * Handles token caching, refresh, and expiry
 */

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  refreshExpiresAt: number;
}

let cachedToken: TokenData | null = null;

/**
 * Gets a fresh access token from Sugargoo
 */
async function getNewToken(): Promise<TokenData> {
  const username = process.env.SUGARGOO_API_USERNAME;
  const password = process.env.SUGARGOO_API_PASSWORD;
  const baseUrl = process.env.SUGARGOO_API_BASE_URL;

  if (!username || !password || !baseUrl) {
    throw new Error('Sugargoo credentials not configured');
  }

  try {
    const response = await fetch(`${baseUrl}/t-api/open/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error(`Token request failed: ${data.msg}`);
    }

    // Cache the token
    cachedToken = {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      expiresAt: data.data.accessTokenExpiresAt,
      refreshExpiresAt: data.data.refreshTokenExpiresAt,
    };

    console.log('✅ Fresh Sugargoo token obtained');
    return cachedToken;
  } catch (error) {
    console.error('❌ Failed to get Sugargoo token:', error);
    throw error;
  }
}

/**
 * Refreshes an expired token
 */
async function refreshToken(refreshToken: string): Promise<TokenData> {
  const baseUrl = process.env.SUGARGOO_API_BASE_URL;

  if (!baseUrl) {
    throw new Error('Sugargoo base URL not configured');
  }

  try {
    const response = await fetch(`${baseUrl}/t-api/open/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    const data = await response.json();

    if (data.code !== 200) {
      console.warn('Token refresh failed, getting new token:', data.msg);
      return getNewToken();
    }

    cachedToken = {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      expiresAt: data.data.accessTokenExpiresAt,
      refreshExpiresAt: data.data.refreshTokenExpiresAt,
    };

    console.log('✅ Sugargoo token refreshed');
    return cachedToken;
  } catch (error) {
    console.error('❌ Token refresh failed, getting new token:', error);
    return getNewToken();
  }
}

/**
 * Gets a valid access token (from cache or refreshes if needed)
 */
export async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // If we have a cached token and it's not expired, use it
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    // 60s buffer before expiry
    return cachedToken.accessToken;
  }

  // If refresh token is still valid, try to refresh
  if (cachedToken && cachedToken.refreshExpiresAt > now) {
    try {
      const newToken = await refreshToken(cachedToken.refreshToken);
      return newToken.accessToken;
    } catch (error) {
      console.error('Refresh failed, getting new token');
      const newToken = await getNewToken();
      return newToken.accessToken;
    }
  }

  // Otherwise, get a completely new token
  const newToken = await getNewToken();
  return newToken.accessToken;
}

/**
 * Clears the cached token (for testing or manual refresh)
 */
export function clearCache(): void {
  cachedToken = null;
  console.log('🗑️ Token cache cleared');
}
