# RAPID Setup Guide

Complete setup for deploying RAPID's instant Sugargoo signup funnel.

## Prerequisites

Before starting, you'll need:

1. **Sugargoo API credentials** (from your Sugargoo account)
   - `SUGARGOO_API_BASE_URL` 
   - `SUGARGOO_API_PASSWORD`

2. **GitHub account** (for deploying to Vercel)

3. **Vercel account** (free, auto-create via GitHub)

4. **(Optional) Google Sheets** (if using product catalog)

5. **(Optional) Meta Pixel ID** (if tracking conversions)

---

## Step 1: Get Sugargoo API Credentials

The signup flow requires direct API access to Sugargoo.

### From Your Sugargoo Account

1. Log in to [sugargoo.com](https://sugargoo.com)
2. Go to **Account Settings** → **API**
3. Copy the following:
   - **API Base URL** (e.g., `https://api.sugargoo.com`)
   - **API Password** (your secret key for HMAC signing)

**⚠️ Keep these private!** Never commit to GitHub.

---

## Step 2: Prepare Environment Variables

### Create .env.local (Local Development)

In the `rapid` directory, create a `.env.local` file:

```bash
# Sugargoo API (Required)
SUGARGOO_API_BASE_URL=https://api.sugargoo.com
SUGARGOO_API_PASSWORD=your-api-password-here

# Optional - Product catalog
GOOGLE_SHEET_ID=your-sheet-id
GOOGLE_API_KEY=your-api-key

# Optional - Email capture (Omnisend)
NEXT_PUBLIC_OMNISEND_BRAND_ID=your-brand-id

# Optional - Meta Pixel tracking
NEXT_PUBLIC_META_PIXEL_ID=951122617742977
META_CONVERSIONS_API_TOKEN=your-token

# Optional - Facebook Lead Ads
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your-verify-token
FACEBOOK_APP_ID=1688034439000172
```

**Only `SUGARGOO_API_BASE_URL` and `SUGARGOO_API_PASSWORD` are required for signup to work.**

---

## Step 3: Test Locally

### Install dependencies

```bash
cd /data/.openclaw/workspace/rapid
npm install
```

### Run development server

```bash
npm run dev
```

This starts the server at `http://localhost:3000`

### Test signup

1. Visit `http://localhost:3000/signup`
2. Enter an email address
3. Click "Create Account"
4. Check the terminal for logs:
   - `📤 Registering email: test@example.com`
   - `✅ Registration successful: test@example.com`
5. You should see success screen with generated password

If you see errors, check:
- Is `SUGARGOO_API_BASE_URL` set correctly?
- Is `SUGARGOO_API_PASSWORD` correct?
- Check terminal output for detailed error messages

---

## Step 4: Push to GitHub

### Create a new repository

1. Go to [github.com/new](https://github.com/new)
2. Name: `rapid`
3. Description: "RAPID - Sugargoo Product Funnel"
4. Choose **Public**
5. Click "Create repository"
6. Copy the HTTPS URL (looks like: `https://github.com/yourusername/rapid.git`)

### Push code

```bash
cd /data/.openclaw/workspace/rapid

# Configure git
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Initialize if needed
git init
git branch -M main

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/rapid.git
git add .
git commit -m "Initial commit: RAPID funnel with Sugargoo auto-registration"
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 5: Deploy to Vercel

### Sign in to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### Create new project

1. Click "New Project" on the Vercel dashboard
2. Find your `rapid` repository in the list
3. Click "Import"

### Configure environment variables

Before deploying, add your environment variables:

1. In the import dialog, scroll to "Environment Variables"
2. Add the required variables:

```
SUGARGOO_API_BASE_URL = https://api.sugargoo.com
SUGARGOO_API_PASSWORD = your-api-password-here
NEXT_PUBLIC_META_PIXEL_ID = 951122617742977 (optional)
```

**⚠️ Do NOT add these to git!** Only in Vercel dashboard.

3. Click "Deploy"

Vercel will:
- Build your project (takes 2-3 minutes)
- Deploy to Vercel's CDN
- Give you a live URL (looks like: `rapid-123abc.vercel.app`)

---

## Step 6: Test Live Signup

1. Visit your Vercel URL
2. Go to `/signup`
3. Test signup with an email
4. Verify success screen appears
5. Check Vercel logs:
   - Go to Vercel dashboard
   - Click your project
   - Click "Deployments"
   - Click latest deployment
   - Click "Functions" → "API"
   - Search for signup logs

---

## Step 7: Set Up Custom Domain (Optional)

If you want a custom domain (e.g., `rapid.yoursite.com`):

1. In Vercel project settings
2. Go to "Domains"
3. Add your custom domain
4. Update your domain's DNS to point to Vercel
   - Instructions shown in Vercel dashboard

---

## (Optional) Set Up Google Sheets for Products

If you want to pull products from a spreadsheet:

### 1. Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create new spreadsheet: "RAPID Products"
3. Add columns:
   - A: Item Name
   - B: Item Image (full URL)
   - C: Item Description
   - D: Price
   - E: Link (product URL)
   - F: Category

4. Add some test products

5. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
   ```

### 2. Enable Google Sheets API

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project:
   - Top left: click project selector dropdown
   - Click "NEW PROJECT"
   - Name it "RAPID"
   - Click "Create"

3. Enable Google Sheets API:
   - Search for "Google Sheets API"
   - Click "Enable"

4. Create API key:
   - Click "Create Credentials"
   - Choose "API Key"
   - Restrict to "Google Sheets API"
   - Copy the key

### 3. Add to Environment

**Locally (.env.local):**
```
GOOGLE_SHEET_ID=your-sheet-id-here
GOOGLE_API_KEY=your-api-key-here
```

**On Vercel:**
1. Project Settings → Environment Variables
2. Add `GOOGLE_SHEET_ID` and `GOOGLE_API_KEY`
3. Redeploy

### 4. Test Products Load

1. Visit your site's product pages
2. Verify products load from Google Sheet
3. Products cache for 1 hour in production

---

## (Optional) Set Up Meta Pixel

If you want conversion tracking:

### 1. Create Meta Pixel

1. Go to [facebook.com/business](https://facebook.com/business)
2. Go to "Pixels" (under Measure & Report)
3. Create new pixel
4. Copy the **Pixel ID**

### 2. Add to Environment

**Locally (.env.local):**
```
NEXT_PUBLIC_META_PIXEL_ID=your-pixel-id
```

**On Vercel:**
1. Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_META_PIXEL_ID`
3. Redeploy

### 3. Verify Tracking

1. Visit your site
2. Open DevTools → Network
3. Look for requests to `graph.instagram.com`
4. Meta Pixel fires on:
   - Page load
   - Signup form shown (`InitiateCheckout`)
   - Signup success (`CompleteRegistration`)

---

## (Optional) Set Up Facebook Lead Ads Webhook

To auto-create accounts from Facebook leads:

### 1. Create Facebook App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create new app → "Business"
3. Copy **App ID** and **App Secret**

### 2. Configure Webhook

In your app settings:
1. Go to Products → Webhooks
2. Callback URL: `https://your-rapid-domain.vercel.app/api/facebook/webhook`
3. Verify Token: Generate a secure token (e.g., random string)
4. Subscribe to: `leadgen`, `leadgen_update`

### 3. Add to Environment

**On Vercel:**
```
FACEBOOK_APP_ID=your-app-id
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your-verify-token
```

### 4. Test Webhook

1. Go to `/api/facebook/test`
2. Check that webhook is responding
3. Create test lead in Lead Ads
4. Check Vercel logs for webhook events

---

## Troubleshooting

### Signup fails: "Server configuration error"

**Issue:** Environment variables not set correctly

**Fix:**
```bash
# Check local .env.local
cat .env.local | grep SUGARGOO

# Or in Vercel Settings → Environment Variables
# Verify both variables exist and are non-empty
```

### Signup fails: "Email already registered"

**Issue:** That email already has a Sugargoo account

**Fix:** User needs to log in to existing account or use different email

### Products not loading

**Issue:** Google Sheets API not configured or disabled

**Fix:**
1. Verify `GOOGLE_SHEET_ID` and `GOOGLE_API_KEY` are set
2. Check Google Cloud Console: Google Sheets API enabled?
3. Check sheet is public/accessible

### Meta Pixel not firing

**Issue:** Pixel ID not set or blocked by ad blocker

**Fix:**
1. Verify `NEXT_PUBLIC_META_PIXEL_ID` in env
2. Check browser console for `fbq` function
3. Try with ad blocker disabled

---

## Next Steps

### Monitor Your Funnel

1. **Vercel Analytics:**
   - Dashboard → your project → Analytics
   - See page views, performance

2. **Signup Analytics:**
   - Check Vercel function logs for signup events
   - Count successes vs errors
   - Monitor error codes

3. **Meta Analytics:**
   - Check Meta Pixel for conversions
   - View in Ads Manager

### Optimize

1. Test different landing pages
   - Create variations in `pages/`
   - A/B test with different URLs
   
2. Monitor conversion rate
   - Signups / Visitors = Conversion %
   - Optimize copy/design if low

3. Add more products
   - Edit Google Sheet
   - Products auto-update hourly

---

## Maintenance

### Monthly Tasks

1. **Check Sugargoo API credentials** - still valid?
2. **Monitor error rates** - any patterns?
3. **Update products** - keep catalog fresh
4. **Review analytics** - what's converting?

### When Issues Arise

1. **Check Vercel logs** - full error details
2. **Test locally** - does it work in development?
3. **Verify env variables** - all set correctly?
4. **Check API status** - is Sugargoo API up?

---

## Key Files

| File | Purpose |
|------|---------|
| `pages/signup.tsx` | Signup form UI |
| `pages/api/sugargoo/register.ts` | Registration API |
| `lib/sugargoo/tokenManager.ts` | Token caching |
| `lib/db/analytics.ts` | Event logging |
| `.env.example` | Env template |

---

## Help & Support

- **RAPID Docs:** README.md, SIGNUP_FLOW.md
- **Deployment issues:** DEPLOYMENT.md
- **Sugargoo support:** support@sugargoo.com
- **Vercel docs:** vercel.com/docs

---

**Status:** ✅ Ready to deploy  
**Last Updated:** June 2026

Good luck with your funnel! 🚀
