import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getAccessToken } from '../../../lib/sugargoo/tokenManager';
import { logSignupEvent } from '../../../lib/db/analytics';
import { addSubscriberToMailerLite } from '../../../lib/mailerlite';
import { createUser, setUserSignupUtmsIfUnset } from '../../../lib/auth/users';
import { setSessionCookie } from '../../../lib/auth/session';

interface RegistrationRequest {
  email: string;
  name?: string;
  password?: string;
  source?: 'website' | 'facebook-lead'; // Track where the signup came from
  channel?: string; // Marketing channel attribution (reddit, meta, organic, ...) — see lib/attribution.ts
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  landingPath?: string;
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

// Sugargoo error codes handled specially below.
const USERNAME_TAKEN = 40013;
const DUPLICATE_REQUEST = 40125;
const MAX_NAME_ATTEMPTS = 3;

/**
 * Fits a name to Sugargoo's 2–50 character limit, optionally with a suffix
 * (used to make a colliding name unique). The suffix always survives
 * truncation; a name too short on its own gets a random one.
 */
function fitSugargooName(base: string, suffix: string = ''): string {
  const trimmed = base.trim();
  if (!suffix && trimmed.length < 2) {
    suffix = crypto.randomInt(1000, 10000).toString();
  }
  return trimmed.slice(0, 50 - suffix.length) + suffix;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      email,
      name,
      password,
      source = 'website',
      channel,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      landingPath,
    } = req.body as RegistrationRequest;

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

    console.log(`📤 Registering email: ${email}`);

    // Sugargoo requires `name` to be unique across all its users, and we
    // default it to the email prefix — so common prefixes collide (40013).
    // The user never chose or sees this value, so on a collision retry with a
    // random suffix rather than failing the signup. Each attempt needs its
    // own timestamp/nonce/signature.
    const baseName = name || email.split('@')[0];
    let sugargooName = fitSugargooName(baseName);
    let data: SugargooResponse;

    for (let attempt = 1; ; attempt++) {
      const requestBody = JSON.stringify({
        email,
        name: sugargooName,
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

      data = await response.json();

      if (data.code !== USERNAME_TAKEN || attempt >= MAX_NAME_ATTEMPTS) break;

      console.log(`🔁 userName taken for ${email} (attempt ${attempt}), retrying with a suffix`);
      sugargooName = fitSugargooName(baseName, crypto.randomInt(1000, 10000).toString());
    }

    // Handle response
    if (data.code === 200 && data.data) {
      console.log(`✅ Registration successful: ${email} (User ID: ${data.data.userId})`);
      
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
            channel,
            utmMedium,
            utmCampaign,
            landingPath,
          });
        });
      }

      // Capture the email locally for remarketing (both website and
      // facebook-lead sources — unlike the analytics log above, this isn't
      // about dedup, it's about building a complete list). Awaited (not
      // setImmediate) with its own bounded timeout: Vercel freezes the
      // function once the response is sent, so real async work fired via
      // setImmediate never gets to finish. addSubscriberToMailerLite never throws, so this can't fail
      // the signup even if MailerLite is down.
      try {
        await addSubscriberToMailerLite(email, name || email.split('@')[0]);
      } catch (mailerLiteErr) {
        console.error(`❌ addSubscriberToMailerLite threw error:`, mailerLiteErr instanceof Error ? mailerLiteErr.message : mailerLiteErr);
      }

      // Create the persistent RAPID account (reuses the Sugargoo login) and, for
      // browser signups, log the user in immediately by setting the session
      // cookie. Wrapped in try/catch that never throws — same non-blocking
      // discipline as MailerLite above: a Supabase outage must not break the
      // Sugargoo signup or change the response. The row is created for both
      // sources so facebook-lead users can log in later, but only the website
      // (browser) source gets a cookie — the Facebook webhook is a server-to-
      // server caller with no browser to receive it.
      try {
        const passwordHash = await bcrypt.hash(data.data.password, 10);
        const user = await createUser({
          email,
          passwordHash,
          name: name || email.split('@')[0],
          sugargooUserId: data.data.userId,
        });
        if (source === 'website' && user) {
          setSessionCookie(res, user.id);
          // First-touch-at-signup UTMs, written only while the row has none, so
          // a later re-registration can't overwrite them. Non-blocking and
          // tolerant of the columns not existing yet (sql/users_utm_attribution.sql).
          await setUserSignupUtmsIfUnset(user.id, { utmSource, utmMedium, utmCampaign, utmContent });
        }
      } catch (acctErr) {
        console.error('⚠️ RAPID account create failed (non-blocking):', acctErr instanceof Error ? acctErr.message : acctErr);
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
            channel,
            utmMedium,
            utmCampaign,
            landingPath,
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
            channel,
            utmMedium,
            utmCampaign,
            landingPath,
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

    if (data.code === DUPLICATE_REQUEST) {
      // Sugargoo rejects a second request for the same email inside a short
      // window — a double submit, or a retry straight after an error. Not a
      // real failure, so it's logged as a warning and the client is told to
      // wait rather than shown Sugargoo's raw message.
      console.warn(`⚠️ Duplicate registration request: ${email}`);
      return res.status(409).json({
        error: 'Your signup is already being processed. Wait a few seconds, then try again.',
        code: DUPLICATE_REQUEST,
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
          channel,
          utmMedium,
          utmCampaign,
          landingPath,
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
          channel: req.body?.channel,
          utmMedium: req.body?.utmMedium,
          utmCampaign: req.body?.utmCampaign,
          landingPath: req.body?.landingPath,
        });
      });
    }
    
    return res.status(500).json({
      error: errorMsg,
    });
  }
}
