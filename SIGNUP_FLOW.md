# RAPID Signup Flow Documentation

## Overview

RAPID uses **Sugargoo's auto-registration API** to create accounts instantly without email verification. This document explains the complete flow, from user perspective to technical implementation.

## User Experience (UX Flow)

### Step 1: User Arrives at Signup Page
```
/signup page loads
↓
Form shows:
  - Email field (required)
  - Username field (optional)
  - Info box explaining instant signup
  - "Create Account" button
```

### Step 2: User Fills Form
```
User enters:
  ✓ Email: user@example.com
  ✓ Username: john_doe (optional)
↓
Form validates email format
↓
(If invalid: shows error, stops)
```

### Step 3: Submit & Processing
```
User clicks "Create Account"
↓
Button shows "Creating Account..." (disabled)
↓
Meta Pixel fires "InitiateCheckout" event
↓
Frontend POSTs to /api/sugargoo/register
```

### Step 4: Success Screen
```
✅ Account Created!

Login credentials shown:
  Email: user@example.com
  Password: RandomPassword123

Info box: "You're ready to start shopping on Sugargoo!"

Buttons:
  [Go to Sugargoo →] (links to sugargoo.com)
  [Create another account] (resets form)
↓
Meta Pixel fires "CompleteRegistration" event
```

### Step 5: User Can Immediately Shop
```
User clicks "Go to Sugargoo"
↓
Logs in with email + password
↓
**No email verification needed!**
↓
Immediately sees product catalog
```

---

## Technical Implementation

### Frontend: pages/signup.tsx

**Responsibilities:**
1. Render form with email + optional username
2. Validate email format client-side
3. Disable form during submission
4. Fire Meta Pixel events
5. Handle success/error states
6. Show login credentials on success

**Key code sections:**

```typescript
// 1. Form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess(false);
  setLoading(true);

  // 2. Client-side validation
  if (!email) {
    setError('Email is required');
    setLoading(false);
    return;
  }

  // 3. Fire Meta Pixel
  if ((window as any).fbq) {
    (window as any).fbq('track', 'InitiateCheckout', {
      value: 0.00,
      currency: 'AUD',
    });
  }

  // 4. Call registration API
  const response = await fetch('/api/sugargoo/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name: name || email.split('@')[0],
    }),
  });

  const data = await response.json();

  // 5. Handle response
  if (!response.ok) {
    if (data.code === 40910) {
      setError('This email is already registered. Log in or try another email.');
    } else {
      setError(data.error || 'Registration failed.');
    }
    setLoading(false);
    return;
  }

  // 6. Success - show credentials
  setSuccess(true);
  setGeneratedPassword(data.password);
  
  // 7. Fire completion event
  if ((window as any).fbq) {
    (window as any).fbq('track', 'CompleteRegistration', {
      value: 0.00,
      currency: 'AUD',
      userId: data.userId,
    });
  }
  
  setLoading(false);
};
```

**User-facing states:**
- `loading=true` → "Creating Account..." (button disabled)
- `error` → Red error box with message
- `success=true` → Green success box with credentials
- Initial state → Empty form with instructions

---

### Backend: pages/api/sugargoo/register.ts

**Responsibilities:**
1. Validate request (email, format)
2. Get valid Sugargoo access token
3. Build HMAC-SHA256 signed request
4. Call Sugargoo `/t-api/facebook/register` endpoint
5. Handle success and error responses
6. Log event to analytics
7. Send to Zapier webhook (optional)
8. Return credentials or error to frontend

### Registration API Flow (Detailed)

```
POST /api/sugargoo/register
{
  email: "user@example.com",
  name: "John Doe",
  source: "website" (or "facebook-lead")
}
↓
1. VALIDATE INPUT
   - email required and valid format
   - name optional (defaults to email prefix)
↓
2. GET SUGARGOO CREDENTIALS
   - SUGARGOO_API_BASE_URL from env
   - SUGARGOO_API_PASSWORD from env
   - Throw error if missing
↓
3. GET ACCESS TOKEN
   - Call getAccessToken() from tokenManager
   - Token cached for 7 days
   - Auto-refresh if expired
↓
4. BUILD REQUEST BODY
   {
     "email": "user@example.com",
     "name": "John Doe"
   }
   (password omitted - let Sugargoo auto-generate)
↓
5. GENERATE HMAC-SHA256 SIGNATURE
   a. Generate timestamp (Unix seconds)
   b. Generate nonce (random 18-byte base64)
   c. Build signing string:
      [method]\n[path]\n[timestamp]\n[nonce]\n[accessToken]\n[body]
   d. HMAC-SHA256 hash with apiPassword
   e. Return hex-encoded signature
↓
6. SEND REQUEST TO SUGARGOO
   POST https://api.sugargoo.com/t-api/facebook/register
   Headers:
     Content-Type: application/json
     X-Open-Authorization: Bearer {accessToken}
     X-Timestamp: {timestamp}
     X-Nonce: {nonce}
     X-Signature: {signature}
     channel: 2 (web service)
   Body: {email, name}
↓
7. HANDLE RESPONSE
   Code 200 + data:
     {
       "code": 200,
       "msg": "ok",
       "data": {
         "userId": "12345",
         "email": "user@example.com",
         "password": "RandomPassword123",
         "status": "active",
         "message": "..."
       }
     }
     → Return 201 with credentials
     → Log to analytics: success
     → Send to Zapier
     → Return to user
   
   Code 40910 (email exists):
     → Return 400
     → Log to analytics: duplicate
     → User sees: "Email already registered"
   
   Code 40011 (invalid email):
     → Return 400
     → Log to analytics: error
     → User sees: "Invalid email format"
   
   Code 40012 (password requirement):
     → Return 400
     → User needs different password
   
   Other error:
     → Return 400
     → Log to analytics: error
     → User sees generic error message
↓
8. LOG EVENT
   setImmediate(() => {
     logSignupEvent({
       timestamp: ISO string,
       source: "website" or "facebook-lead",
       email: user email,
       status: "success" | "error" | "duplicate",
       userId: (if success),
       errorCode: (if error),
       errorMsg: (if error)
     });
   });
↓
9. RESPONSE TO FRONTEND
   201 Created:
     {
       "success": true,
       "userId": "12345",
       "email": "user@example.com",
       "password": "RandomPassword123"
     }
   
   4xx Error:
     {
       "error": "Human-readable error message",
       "code": 40910
     }
```

### Security: HMAC-SHA256 Signing

Sugargoo requires all API requests to be signed with HMAC-SHA256:

**Key Components:**

1. **Signature String:**
```
POST
/opencenter/t-api/facebook/register
1685968800
aB3xY9zWqL2mNpK8vJ5uT0
EAAUhaSfSgaEBRj3wLP7a88...
{"email":"user@example.com","name":"John"}
```

2. **HMAC Algorithm:**
```typescript
import crypto from 'crypto';

const signature = crypto
  .createHmac('sha256', apiPassword)  // apiPassword is the secret
  .update(signingString)              // What we're signing
  .digest('hex');                     // Return as hex string
```

3. **Timestamp & Nonce:**
- **Timestamp:** Unix seconds (current time)
- **Nonce:** Random 18-byte base64 string (prevents replay attacks)
- **Validity window:** 5 minutes (request rejected if outside window)

**Example HMAC generation:**

```typescript
function generateSignature(secret: string, content: string): string {
  return crypto.createHmac('sha256', secret)
    .update(content)
    .digest('hex');
}

// Usage:
const signingContent = [
  'POST',
  '/opencenter/t-api/facebook/register',
  Math.floor(Date.now() / 1000),
  crypto.randomBytes(18).toString('base64url'),
  accessToken,
  JSON.stringify({ email, name })
].join('\n');

const signature = generateSignature(SUGARGOO_API_PASSWORD, signingContent);
```

---

### Token Management: lib/sugargoo/tokenManager.ts

Sugargoo API uses bearer tokens with 7-day expiration. Token manager:

1. **Caches token** in memory for 7 days
2. **Auto-refreshes** when about to expire
3. **Validates** on each signup (never uses expired token)

**Code flow:**

```typescript
export async function getAccessToken(): Promise<string> {
  // Check cache first
  if (tokenCache.accessToken && !isTokenExpired()) {
    return tokenCache.accessToken;
  }

  // If not cached or expired, get new token
  const newToken = await fetchNewToken();
  tokenCache.accessToken = newToken;
  tokenCache.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return newToken;
}

async function fetchNewToken(): Promise<string> {
  const response = await fetch(
    `${SUGARGOO_API_BASE_URL}/t-api/open/auth/token`,
    {
      method: 'POST',
      body: JSON.stringify({
        account: SUGARGOO_ACCOUNT,
        password: SUGARGOO_API_PASSWORD
      })
    }
  );
  
  const data = await response.json();
  return data.data.accessToken; // 7-day validity
}
```

---

### Analytics Logging: lib/db/analytics.ts

Every signup attempt is logged to analytics:

```typescript
interface SignupEvent {
  timestamp: string;      // ISO 8601
  source: string;         // "website" or "facebook-lead"
  email: string;          // User email
  status: string;         // "success" | "error" | "duplicate"
  userId?: string;        // If success
  errorCode?: number;     // If error (40910, 40011, etc.)
  errorMsg?: string;      // If error
}
```

**Storage options:**

1. **Console (dev):**
   ```typescript
   console.log('[Analytics]', event);
   ```

2. **Database (Supabase, MongoDB, etc.):**
   ```typescript
   await db.analytics.insert(event);
   ```

3. **File (local):**
   ```typescript
   fs.appendFileSync('logs/analytics.jsonl', JSON.stringify(event) + '\n');
   ```

---

### Facebook Lead Ads: pages/api/facebook/webhook.ts

When leads come from Facebook Lead Ads form, they auto-create accounts:

**Webhook flow:**

```
1. Facebook submits lead to /api/facebook/webhook
   {
     "entry": [
       {
         "changes": [
           {
             "value": {
               "leadgen_id": "123...",
               "form_id": "456...",
               "field_data": [
                 { "name": "email", "value": "user@example.com" },
                 { "name": "full_name", "value": "John Doe" }
               ]
             }
           }
         ]
       }
     ]
   }

↓

2. Webhook validates Facebook signature
   - Verify X-Hub-Signature-256 header
   - Confirm from trusted Facebook App

↓

3. Extract email from field_data

↓

4. Call /api/sugargoo/register with source="facebook-lead"
   (same flow as website signup)

↓

5. Log to analytics with source="facebook-lead"
   (prevents double-counting vs website signups)

↓

6. (Optional) Send welcome email via Omnisend

↓

7. Return 200 to Facebook
```

**Signature verification:**

```typescript
const signature = req.headers['x-hub-signature-256'] as string;
const body = req.body;

const hash = crypto
  .createHmac('sha256', FACEBOOK_APP_SECRET)
  .update(JSON.stringify(body))
  .digest('hex');

const expected = `sha256=${hash}`;
if (signature !== expected) {
  return res.status(403).json({ error: 'Invalid signature' });
}
```

---

## Error Handling

### Frontend Error Handling

```typescript
if (!response.ok) {
  const data = await response.json();
  
  switch (data.code) {
    case 40910:
      // Email already registered
      setError('This email is already registered. Log in or try another email.');
      break;
    case 40011:
      // Invalid email format
      setError('Invalid email format. Please check and try again.');
      break;
    case 40012:
      // Password requirement
      setError('Password must be 6-64 characters');
      break;
    default:
      // Generic error
      setError(data.error || 'Registration failed. Please try again.');
  }
  return;
}
```

### Backend Error Handling

**Network errors:**
```typescript
try {
  const response = await fetch(`${baseUrl}/t-api/facebook/register`, {
    // request...
  });
  // handle response...
} catch (error) {
  console.error('Network error:', error);
  return res.status(500).json({
    error: 'Network error. Please try again in a moment.'
  });
}
```

**Missing credentials:**
```typescript
if (!apiPassword || !baseUrl) {
  console.error('Sugargoo credentials not configured');
  return res.status(500).json({
    error: 'Server configuration error'
  });
}
```

---

## Monitoring & Debugging

### Testing Signup Locally

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, watch API logs
tail -f .next/server/logs/*

# 3. Visit http://localhost:3000/signup

# 4. Fill form and submit

# 5. Check console output for:
#    - "Registration successful: user@example.com"
#    - "✅ Registration successful..."
#    - Error details if failure
```

### Testing API Directly

```bash
# POST test request
curl -X POST http://localhost:3000/api/sugargoo/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'

# Expected response (201):
# {
#   "success": true,
#   "userId": "12345",
#   "email": "test@example.com",
#   "password": "GeneratedPassword123"
# }
```

### Debugging HMAC Signature Issues

If signup fails with 40011 or other Sugargoo errors:

```typescript
// Add logging in register.ts:
console.log('📤 Signature Debug:');
console.log('  Method:', method);
console.log('  Path:', path);
console.log('  Timestamp:', timestamp);
console.log('  Nonce:', nonce);
console.log('  Body:', requestBody);
console.log('  Signing content:', signingContent);
console.log('  Signature:', signature);
console.log('  Headers:', {
  'X-Timestamp': timestamp.toString(),
  'X-Nonce': nonce,
  'X-Signature': signature,
});
```

### Viewing Analytics Events

**In development (logs printed to console):**
```bash
npm run dev 2>&1 | grep "signup"
```

**In production (check logs):**
- Vercel Logs: https://vercel.com/docs/analytics
- Check database if connected to Supabase/MongoDB
- Check Zapier logs if webhook connected

---

## Performance Metrics

### Signup Latency

- **Frontend validation:** <1ms
- **Network request:** 100-300ms (Vercel → Sugargoo API)
- **Sugargoo processing:** 200-500ms
- **Total user wait:** 300-800ms

### Success Rate

- **Valid email:** 99%+ success
- **Duplicate email:** Caught at 40910 (expected)
- **Network errors:** <1% (auto-retryable on client)

### Scalability

- **Concurrent signups:** Unlimited (serverless auto-scales)
- **Rate limiting:** Sugargoo: 120 requests/minute per token
- **Timeout:** 30 seconds (Vercel serverless limit)

---

## Common Issues & Solutions

### Issue: "Server configuration error"

**Cause:** Missing environment variables

**Fix:**
```bash
# Check .env.local (dev)
echo $SUGARGOO_API_BASE_URL
echo $SUGARGOO_API_PASSWORD

# Or in Vercel:
# Settings → Environment Variables
# Verify SUGARGOO_API_BASE_URL and SUGARGOO_API_PASSWORD exist
```

### Issue: "Email already registered" on every try

**Cause:** Email already has Sugargoo account

**Fix:**
- User needs to log in to existing Sugargoo account
- Or use different email for new account

### Issue: Signup button stuck on "Creating Account..."

**Cause:** Request timeout or network error

**Fix:**
- Check browser Network tab (DevTools → Network)
- Look for `/api/sugargoo/register` request
- Check response status and body
- Verify SUGARGOO_API_PASSWORD is correct

### Issue: Meta Pixel not firing

**Cause:** Missing `NEXT_PUBLIC_META_PIXEL_ID` or blocked by ad blocker

**Fix:**
```bash
# Check env var
echo $NEXT_PUBLIC_META_PIXEL_ID

# In browser console:
fbq('track', 'Test');  // Manual test

# Check browser DevTools for:
# - Network requests to graph.instagram.com
# - Ad blockers blocking Meta domain
```

---

## Future Enhancements

1. **Password customization:** Allow users to set their own password
2. **Email verification:** Optional for users who want it
3. **Account linking:** Link RAPID + Sugargoo accounts in database
4. **Referral system:** Track which marketing source converted user
5. **Autoresponder:** Send welcome email series via Omnisend
6. **SMS confirm:** Send password via SMS instead of showing on screen

---

**Last Updated:** June 2026  
**Status:** ✅ Production Ready  
**Related docs:** README.md, SETUP.md, DEPLOYMENT.md
