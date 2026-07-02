import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

/**
 * Test endpoint to verify Sugargoo connectivity and registration
 * GET /api/sugargoo/test
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const SUGARGOO_BASE_URL = process.env.SUGARGOO_API_BASE_URL || 'https://www.sugargootest.com/api/opencenter';
  const API_USERNAME = process.env.SUGARGOO_API_USERNAME || '';
  const API_PASSWORD = process.env.SUGARGOO_API_PASSWORD || '';

  try {
    // Step 1: Get token
    console.log('[Test] Step 1: Getting token...');
    const tokenUrl = `${SUGARGOO_BASE_URL}/t-api/open/auth/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: API_USERNAME,
        password: API_PASSWORD,
      }),
    });
    const tokenData = await tokenResponse.json();

    if (tokenData.code !== 200 || !tokenData.data) {
      return res.status(200).json({
        step: 1,
        error: 'Token fetch failed',
        response: tokenData,
      });
    }

    const accessToken = tokenData.data.accessToken;
    console.log('[Test] Step 1: Token obtained ✓');

    // Step 2: Try registration
    console.log('[Test] Step 2: Attempting registration...');
    const registrationPath = '/opencenter/t-api/facebook/register';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(18).toString('base64url');

    const registrationBody = JSON.stringify({
      email: 'test-' + Date.now() + '@gmail.com',
      name: 'Test User',
    });

    const signingContent = `POST\n${registrationPath}\n${timestamp}\n${nonce}\n${accessToken}\n${registrationBody}`;
    const signature = crypto.createHmac('sha256', API_PASSWORD).update(signingContent).digest('hex');

    const registrationUrl = `${SUGARGOO_BASE_URL}${registrationPath}`;
    console.log('[Test] Registration URL:', registrationUrl);
    console.log('[Test] Headers:', {
      'X-Open-Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signature.substring(0, 20) + '...',
    });

    const registrationResponse = await fetch(registrationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Open-Authorization': `Bearer ${accessToken}`,
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-Signature': signature,
      },
      body: registrationBody,
    });

    const registrationData = await registrationResponse.json();
    console.log('[Test] Registration response:', registrationData);

    return res.status(200).json({
      ok: true,
      step: 2,
      token: {
        ok: true,
        accessToken: accessToken.substring(0, 20) + '...',
      },
      registration: registrationData,
    });
  } catch (error) {
    console.error('[Test] Error:', error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
