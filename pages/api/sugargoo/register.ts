import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getAccessToken } from '../../../lib/sugargoo/tokenManager';
import { logSignupEvent } from '../../../lib/db/analytics';
import { addSubscriberToMailerLite } from '../../../lib/mailerlite';

interface RegistrationRequest {
  email: string;
  name?: string;
  password?: string;
  source?: 'website' | 'facebook-lead'; // Track where the signup came from
}

interface SugargooSuccess {
  code: 200;
  msg: 'ok';
  data: {
    userId: string;
    email: string;
    password: string;
    status: 'active';
    message: string;
  };
}

interface SugargooError {
  code: number;
  msg: string;
  data: null;
}

type SugargooResponse = SugargooSuccess | SugargooError;

interface ApiResponse {
  success?: boolean;
  userId?: string;
  email?: string;
  password?: string;
  error?: string;
  code?: number;
}

/**
 * Send email to Zapier webhook with timeout
 */
async function sendToZapier(email: string, timeoutMs: number = 5000): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch('https://hooks.zapier.com/hooks/catch/25304829/43qjotk/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Connection': 'close',
      },
      body: JSON.stringify({ email }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ Sent to Zapier: ${email}`);
    } else {
      console.warn(`⚠️ Zapier returned ${response.status}`);
    }
  } catch (error) {
    // Log error but don't throw (don't block signup)
    console.error('⚠️ Zapier send failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Generates a Unix timestamp in seconds
 */
function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Generates a random nonce (Base64 URL-safe, matching Java implementation)
 */
function generateNonce(): string {
  return crypto.randomBytes(18).toString('base64url');
}

/**
 * Builds the signing content string
 */
function buildSigningContent(
  method: string,
  path: string,
  timestamp: number,
  nonce: string,
  accessToken: string,
  body: string
): string {
  return [method, path, timestamp, nonce, accessToken, body].join('\n');
}

/**
 * Generates HMAC-SHA256 signature
 */
function generateSignature(secret: string, content: string): string {
  return crypto.createHmac('sha256', secret).update(content).digest('hex');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, password, source = 'website' } = req.body as RegistrationRequest;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get Sugargoo credentials
    const apiPassword = process.env.SUGARGOO_API_PASSWORD;
    const baseUrl = process.env.SUGARGOO_API_BASE_URL;

    if (!apiPassword || !baseUrl) {
      console.error('Sugargoo credentials not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get valid access token
    const accessToken = await getAccessToken();

    // Build request body
    const requestBody = JSON.stringify({
      email,
      name: name || email.split('@')[0],
      // Password omitted - let Sugargoo auto-generate
      ...(password && { password }),
    });

    // Generate signature components
    const timestamp = generateTimestamp();
    const nonce = generateNonce();
    const method = 'POST';
    const path = '/opencenter/t-api/facebook/register';

    // Build signing content
    const signingContent = buildSigningContent(
      method,
      path,
      timestamp,
      nonce,
      accessToken,
      requestBody
    );

    // Generate signature
    const signature = generateSignature(apiPassword, signingContent);

    console.log(`📤 Registering email: ${email}`);

    // Call Sugargoo registration endpoint
    const response = await fetch(`${baseUrl}/t-api/facebook/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Open-Authorization': `Bearer ${accessToken}`,
        'X-Timestamp': timestamp.toString(),
        'X-Nonce': nonce,
        'X-Signature': signature,
        'channel': '2', // 2 = PC (web service), 1 = App
      },
      body: requestBody,
    });

    const data: SugargooResponse = await response.json();

    // Handle response
    if (data.code === 200 && data.data) {
      console.log(`✅ Registration successful: ${email} (User ID: ${data.data.userId})`);
      
      // Send to Zapier BEFORE response (ensures it completes)
      console.log(`🚀 Calling sendToZapier for ${email}...`);
      try {
        await sendToZapier(email);
        console.log(`✅ sendToZapier completed successfully`);
      } catch (zapierErr) {
        console.error(`❌ sendToZapier threw error:`, zapierErr instanceof Error ? zapierErr.message : zapierErr);
      }
      
      // Log event asynchronously (non-blocking) - ONLY if source is 'website'
      // (Facebook leads are already logged by webhook.ts, avoid double-counting)
      if (source === 'website') {
        setImmediate(() => {
          logSignupEvent({
            timestamp: new Date().toISOString(),
            source: 'website',
            email,
            status: 'success',
            userId: data.data.userId,
          });
        });
      }

      // Capture the email locally for remarketing (both website and
      // facebook-lead sources — unlike the analytics log above, this isn't
      // about dedup, it's about building a complete list). Awaited (not
      // setImmediate) with its own bounded timeout — same reasoning as
      // sendToZapier above: Vercel freezes the function once the response
      // is sent, so real async work fired via setImmediate never gets to
      // finish. addSubscriberToMailerLite never throws, so this can't fail
      // the signup even if MailerLite is down.
      try {
        await addSubscriberToMailerLite(email, name || email.split('@')[0]);
      } catch (mailerLiteErr) {
        console.error(`❌ addSubscriberToMailerLite threw error:`, mailerLiteErr instanceof Error ? mailerLiteErr.message : mailerLiteErr);
      }

      return res.status(201).json({
        success: true,
        userId: data.data.userId,
        email: data.data.email,
        password: data.data.password,
      });
    }

    if (data.code === 200) {
      // Success but no data returned (shouldn't happen)
      return res.status(201).json({
        success: true,
      });
    }

    // Handle specific error codes
    if (data.code === 40910) {
      console.log(`⚠️ Email already registered: ${email}`);
      
      // Log event asynchronously - ONLY if source is 'website'
      if (source === 'website') {
        setImmediate(() => {
          logSignupEvent({
            timestamp: new Date().toISOString(),
            source: 'website',
            email,
            status: 'duplicate',
            errorCode: 40910,
            errorMsg: 'Email already registered',
          });
        });
      }
      
      return res.status(400).json({
        error: 'Email already registered. Please log in or use a different email.',
        code: 40910,
      });
    }

    if (data.code === 40011) {
      console.log(`❌ Invalid email format: ${email}`);
      
      // Log event asynchronously - ONLY if source is 'website'
      if (source === 'website') {
        setImmediate(() => {
          logSignupEvent({
            timestamp: new Date().toISOString(),
            source: 'website',
            email,
            status: 'error',
            errorCode: 40011,
            errorMsg: 'Invalid email format',
          });
        });
      }
      
      return res.status(400).json({
        error: 'Invalid email format',
        code: 40011,
      });
    }

    if (data.code === 40012) {
      console.log(`❌ Password too weak`);
      return res.status(400).json({
        error: 'Password must be 6-64 characters',
        code: 40012,
      });
    }

    // Generic error
    console.error(`❌ Registration failed: ${data.msg} (code: ${data.code})`);
    
    // Log event asynchronously - ONLY if source is 'website'
    if (source === 'website') {
      setImmediate(() => {
        logSignupEvent({
          timestamp: new Date().toISOString(),
          source: 'website',
          email,
          status: 'error',
          errorCode: data.code,
          errorMsg: data.msg || 'Registration failed',
        });
      });
    }
    
    return res.status(400).json({
      error: data.msg || 'Registration failed',
      code: data.code,
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Log event asynchronously - ONLY if source is 'website'
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    const source = req.body?.source || 'website';
    if (source === 'website') {
      setImmediate(() => {
        logSignupEvent({
          timestamp: new Date().toISOString(),
          source: 'website',
          email: req.body?.email || 'unknown',
          status: 'error',
          errorCode: 500,
          errorMsg,
        });
      });
    }
    
    return res.status(500).json({
      error: errorMsg,
    });
  }
}
