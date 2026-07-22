/**
 * Adds a signup to MailerLite at the moment of RAPID account creation,
 * instead of relying solely on Sugargoo's weekly email export. Non-blocking
 * by design — call this via setImmediate() from the signup handler, never
 * await it inline, so a MailerLite outage or slowdown can never affect the
 * actual signup response.
 */
export async function addSubscriberToMailerLite(email: string, name?: string): Promise<void> {
  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  if (!apiKey || !groupId) {
    console.warn('⚠️ MailerLite not configured (MAILERLITE_API_KEY/MAILERLITE_GROUP_ID) — skipping');
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
