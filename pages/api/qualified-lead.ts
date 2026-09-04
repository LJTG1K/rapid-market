import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { serialize } from 'cookie';
import { getUserIdFromRequest } from '../../lib/auth/session';
import { findUserById } from '../../lib/auth/users';
import { logSignupEvent } from '../../lib/db/analytics';
import { logQualifiedLead } from '../../lib/db/behaviorEvents';
import { sendMetaConversionEvent } from '../../lib/metaConversions';

// A visitor counts as a "recent" signup — i.e. still mid-onboarding, not just
// any returning logged-in user — if their account was created within this
// window of hitting /tutorial.
const RECENT_SIGNUP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Prevents re-firing QualifiedLead (and re-logging the sequence) on every
// reload of /tutorial within the same browser session.
const SENT_COOKIE_NAME = 'rapid_qlead_sent';
const SENT_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

interface QualifiedLeadResponse {
  qualified: boolean;
  eventId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QualifiedLeadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ qualified: false });
  }

  try {
    if (req.cookies[SENT_COOKIE_NAME]) {
      return res.status(200).json({ qualified: false });
    }

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(200).json({ qualified: false });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(200).json({ qualified: false });
    }

    const signedUpAt = new Date(user.created_at).getTime();
    if (!Number.isFinite(signedUpAt) || Date.now() - signedUpAt > RECENT_SIGNUP_WINDOW_MS) {
      return res.status(200).json({ qualified: false });
    }

    const eventId = crypto.randomUUID();
    const ip = Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await sendMetaConversionEvent({
      eventName: 'QualifiedLead',
      eventId,
      email: user.email,
      ip: ip as string | undefined,
      userAgent: req.headers['user-agent'],
      eventSourceUrl: 'https://rapid.market/tutorial',
    });

    // Best-effort, non-blocking logging — mirrors the discipline already used
    // for signup logging in pages/api/sugargoo/register.ts.
    try {
      logSignupEvent({
        timestamp: new Date().toISOString(),
        source: 'website',
        email: user.email,
        status: 'signup_then_tutorial',
        userId: user.id,
      });
    } catch (error) {
      console.error('⚠️ signup_then_tutorial analytics log failed (non-blocking):', error instanceof Error ? error.message : error);
    }

    try {
      await logQualifiedLead(user.id);
    } catch (error) {
      console.error('⚠️ qualified_lead behavior event failed (non-blocking):', error instanceof Error ? error.message : error);
    }

    res.setHeader(
      'Set-Cookie',
      serialize(SENT_COOKIE_NAME, '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SENT_COOKIE_MAX_AGE,
      })
    );

    return res.status(200).json({ qualified: true, eventId });
  } catch (error) {
    console.error('Qualified-lead check error:', error);
    return res.status(200).json({ qualified: false });
  }
}
