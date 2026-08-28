/**
 * Adds a signup to MailerLite at the moment of RAPID account creation,
 * instead of relying solely on Sugargoo's weekly email export.
 *
 * Must be awaited directly from the signup handler, NOT fired via
 * setImmediate() — Vercel freezes a serverless function's execution
 * context as soon as the HTTP response is sent, so any real async work
 * (this does a network fetch) scheduled via setImmediate silently never
 * completes once the response has gone out. This mirrors the existing
 * sendToZapier() pattern in pages/api/sugargoo/register.ts, which hit the
 * exact same issue and is why it's awaited with a bounded timeout instead
 * of fired-and-forgotten. This function never throws, and the timeout
 * below bounds how much latency a MailerLite outage can add to signup.
 */
// Strips whitespace and accidental surrounding quotes — a common copy-paste
// artifact when a value is grabbed from a JSON response (e.g. "123") and
// pasted verbatim into an env var field, which MailerLite's API then
// rejects as "not numeric" since the quote characters are part of the string.
function sanitizeEnvValue(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

/** Returns the sanitized MailerLite API key, or null (with a warning) if unconfigured. */
function getApiKey(): string | null {
  const rawApiKey = process.env.MAILERLITE_API_KEY;
  if (!rawApiKey) {
    console.warn('⚠️ MailerLite not configured (MAILERLITE_API_KEY) — skipping');
    return null;
  }
  return sanitizeEnvValue(rawApiKey);
}

export async function addSubscriberToMailerLite(email: string, name?: string, timeoutMs: number = 5000): Promise<void> {
  const rawGroupId = process.env.MAILERLITE_GROUP_ID;
  const apiKey = getApiKey();

  if (!apiKey || !rawGroupId) {
    if (apiKey) console.warn('⚠️ MailerLite not configured (MAILERLITE_GROUP_ID) — skipping');
    return;
  }

  const groupId = sanitizeEnvValue(rawGroupId);

  if (!/^\d+$/.test(groupId)) {
    console.error(
      `⚠️ MailerLite skipped: MAILERLITE_GROUP_ID doesn't look like a plain numeric ID after sanitizing (got ${JSON.stringify(groupId)}, length ${groupId.length}). Check the Vercel env var value for stray quotes/whitespace.`
    );
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        fields: name ? { name } : undefined,
        groups: [groupId],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text();
      console.error(`⚠️ MailerLite subscribe failed (${response.status}): ${body}`);
      return;
    }

    console.log(`✅ MailerLite: added ${email} to group ${groupId}`);
  } catch (error) {
    // Never throw — this must not affect the signup flow it's called from.
    console.error('⚠️ MailerLite subscribe error (non-blocking):', error instanceof Error ? error.message : error);
  }
}

/**
 * Upserts a subscriber's custom fields (e.g. last_browsed_brand,
 * wishlist_pick_1_name) without changing group membership. Used by the
 * behavioral-automation cron jobs to stage merge-field data on a subscriber
 * before addSubscriberToGroup fires the automation that reads it — MailerLite
 * applies field updates before the group-join trigger evaluates, but staging
 * fields first keeps the two calls independently retryable.
 */
export async function upsertSubscriberFields(
  email: string,
  fields: Record<string, string>,
  timeoutMs: number = 5000
): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ email, fields }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text();
      console.error(`⚠️ MailerLite field update failed for ${email} (${response.status}): ${body}`);
      return;
    }

    console.log(`✅ MailerLite: updated fields for ${email}`);
  } catch (error) {
    console.error('⚠️ MailerLite field update error (non-blocking):', error instanceof Error ? error.message : error);
  }
}

/**
 * Adds an existing subscriber to a group by numeric group ID, which fires any
 * MailerLite automation triggered by "subscriber joins group" on that group.
 * Throws-never, matching addSubscriberToMailerLite — callers decide whether a
 * failure should block their own bookkeeping (e.g. markTriggered).
 */
export async function addSubscriberToGroup(
  email: string,
  groupId: string,
  timeoutMs: number = 5000
): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(
      `https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}/groups/${encodeURIComponent(groupId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text();
      console.error(`⚠️ MailerLite group-add failed for ${email} -> group ${groupId} (${response.status}): ${body}`);
      return false;
    }

    console.log(`✅ MailerLite: added ${email} to group ${groupId}`);
    return true;
  } catch (error) {
    console.error('⚠️ MailerLite group-add error (non-blocking):', error instanceof Error ? error.message : error);
    return false;
  }
}
