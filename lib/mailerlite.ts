/**
 * Adds a signup to MailerLite at the moment of RAPID account creation,
 * instead of relying solely on Sugargoo's weekly email export. Non-blocking
 * by design — call this via setImmediate() from the signup handler, never
 * await it inline, so a MailerLite outage or slowdown can never affect the
 * actual signup response.
 */
// Strips whitespace and accidental surrounding quotes — a common copy-paste
// artifact when a value is grabbed from a JSON response (e.g. "123") and
// pasted verbatim into an env var field, which MailerLite's API then
// rejects as "not numeric" since the quote characters are part of the string.
function sanitizeEnvValue(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

export async function addSubscriberToMailerLite(email: string, name?: string): Promise<void> {
  const rawApiKey = process.env.MAILERLITE_API_KEY;
  const rawGroupId = process.env.MAILERLITE_GROUP_ID;

  if (!rawApiKey || !rawGroupId) {
    console.warn('⚠️ MailerLite not configured (MAILERLITE_API_KEY/MAILERLITE_GROUP_ID) — skipping');
    return;
  }

  const apiKey = sanitizeEnvValue(rawApiKey);
  const groupId = sanitizeEnvValue(rawGroupId);

  if (!/^\d+$/.test(groupId)) {
    console.error(
      `⚠️ MailerLite skipped: MAILERLITE_GROUP_ID doesn't look like a plain numeric ID after sanitizing (got ${JSON.stringify(groupId)}, length ${groupId.length}). Check the Vercel env var value for stray quotes/whitespace.`
    );
    return;
  }

  try {
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
    });

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
