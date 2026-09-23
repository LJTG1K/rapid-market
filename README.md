# RAPID. - Sugargoo Auto-Registration Funnel

A high-converting funnel platform for Sugargoo with **instant account creation**. Built with Next.js and designed for seamless zero-friction signup.

## ✨ Features

- ⚡ **Instant Signup** - Create Sugargoo accounts instantly with auto-generated passwords (no email verification needed)
- 📊 **Complete Analytics** - Track product clicks, signups, errors, and user sources
- 🎯 **Sugargoo API Integration** - Direct HMAC-SHA256 signed requests to Sugargoo's auto-registration endpoint
- 📱 **Responsive Design** - Perfect on mobile, tablet, and desktop
- 🚀 **Production Ready** - Deploy to Vercel in minutes with zero downtime
- 🔗 **Google Sheets Integration** - Optional: Pull product data from spreadsheets
- 💌 **Email Capture** - Omnisend integration for email & SMS campaigns
- 🎨 **Blog System** - Content marketing with dynamic blog posts
- 📘 **Facebook Lead Ads** - Auto-create accounts from Facebook lead form submissions
- 🟪 **Meta Pixel & Conversions API** - Accurate conversion tracking

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit with your Sugargoo API credentials
# SUGARGOO_API_BASE_URL=https://api.sugargoo.com
# SUGARGOO_API_PASSWORD=your-api-password

# Run dev server
npm run dev
```

Visit `http://localhost:3000`

### Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# In Vercel dashboard:
# 1. Connect your GitHub repo
# 2. Add environment variables
# 3. Deploy (auto on git push)
```

## Project Structure

```
rapid/
├── pages/
│   ├── api/
│   │   ├── sugargoo/
│   │   │   ├── register.ts        # ⭐ Instant signup API
│   │   │   ├── auth.ts            # Token management
│   │   │   └── test.ts            # Debug endpoint
│   │   ├── facebook/
│   │   │   ├── webhook.ts         # Lead Ads auto-signup
│   │   │   └── test.ts            # Testing
│   │   ├── analytics/
│   │   │   └── events.ts          # Event logging
│   │   ├── products.ts            # Fetch products
│   │   ├── track.ts               # Click tracking
│   │   ├── meta-conversions.ts    # Conversions API
│   │   └── sitemap.xml.ts         # SEO sitemap
│   ├── blog/                       # Blog posts (dynamic)
│   ├── _app.tsx                    # App wrapper (Meta Pixel)
│   ├── _document.tsx               # HTML setup
│   ├── index.tsx                   # Home/hero
│   ├── fashion-listings.tsx        # Fashion products
│   ├── tech-listings.tsx           # Tech products
│   ├── gillys-picks.tsx            # Curated selections
│   ├── signup.tsx                  # ⭐ Signup form
│   ├── tutorial.tsx                # How-to guide
│   └── landingpagetest-*.tsx       # A/B test pages
├── lib/
│   ├── sugargoo/
│   │   └── tokenManager.ts         # Token caching & refresh
│   ├── db/
│   │   └── analytics.ts            # Event logging
│   └── imageOptimization.ts        # Image optimization
├── components/
│   ├── Header.tsx                  # Navigation
│   └── Footer.tsx                  # Footer
├── styles/
│   └── globals.css                 # Design system
├── .env.example                    # Environment template
├── next.config.js                  # Next.js config
├── tailwind.config.js              # Tailwind config
└── package.json                    # Dependencies
```

## Signup Flow

### How It Works

1. User visits `/signup` page
2. Fills in email + optional username
3. Frontend calls `POST /api/sugargoo/register`
4. Backend authenticates with Sugargoo API using HMAC-SHA256
5. Sugargoo auto-creates account with password
6. User sees credentials and "Go to Sugargoo" button
7. **User can immediately shop** (no email verification needed!)

### API Endpoint: POST /api/sugargoo/register

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "source": "website"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "userId": "12345",
  "email": "user@example.com",
  "password": "GeneratedPassword123"
}
```

**Error Response (400):**
```json
{
  "error": "Email already registered. Please log in or try another email.",
  "code": 40910
}
```

**Error Codes:**
- `40910` - Email already registered
- `40011` - Invalid email format
- `40012` - Password requirement (if custom password provided)

### Facebook Lead Ads Integration

Leads from Facebook Lead Ads automatically create Sugargoo accounts:

**Webhook:** `POST /api/facebook/webhook`

**Flow:**
1. Lead submitted in Facebook Lead Ads form
2. Facebook sends webhook to RAPID
3. Email extracted from lead data
4. Sugargoo account auto-created
5. Welcome email sent (if Omnisend configured)
6. Analytics logged with source="facebook-lead"

## Environment Variables

### Required - Sugargoo API

```env
SUGARGOO_API_BASE_URL=https://api.sugargoo.com
SUGARGOO_API_PASSWORD=your-api-password
```

Get these from your Sugargoo account dashboard.

### Optional - Product Catalog

```env
GOOGLE_SHEET_ID=your-sheet-id
GOOGLE_API_KEY=your-api-key
```

Products will auto-cache for 1 hour in production.

### Optional - Email Marketing

```env
NEXT_PUBLIC_OMNISEND_BRAND_ID=your-brand-id
```

Users can opt-in to email list during signup.

### Optional - Meta Tracking

```env
NEXT_PUBLIC_META_PIXEL_ID=951122617742977
META_CONVERSIONS_API_TOKEN=your-token
META_CONVERSIONS_API_VERSION=v19.0
```

Fires: `InitiateCheckout` (form shown), `CompleteRegistration` (signup success)

### Optional - Facebook Lead Ads

```env
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your-token
FACEBOOK_APP_ID=1688034439000172
```

## Analytics

### Events Tracked

- `signup_start` - User opened signup form
- `signup_success` - Account created (with userId)
- `signup_error` - Registration failed (with error code)
- `product_click` - User clicked product link
- `page_view` - Page loaded
- `fb_lead` - Lead from Facebook Lead Ads

### Viewing Analytics

Events logged to database. In development, check console logs:

```bash
# Watch for signup events
npm run dev | grep "Registration"
```

## Deployment

### To Vercel

```bash
# 1. Push code to GitHub
git add .
git commit -m "Update RAPID docs"
git push origin main

# 2. In Vercel Dashboard:
#    - Connect GitHub repo
#    - Add env variables
#    - Click Deploy

# 3. Vercel auto-deploys on future git pushes
```

See `DEPLOYMENT.md` for detailed steps.

## Performance & Security

**Performance:**
- Product data cached 1 hour (prod) / 5 min (dev)
- Images lazy-loaded natively
- Vercel global CDN
- Sub-1s API responses

**Security:**
- HMAC-SHA256 signed Sugargoo requests
- No passwords stored (Sugargoo generates)
- No sensitive data in logs
- HTTPS enforced by Vercel
- Facebook webhook signature verified

## Troubleshooting

### Signup failing with "Email already registered"
- User already has a Sugargoo account
- Try different email or direct login to Sugargoo

### "Server configuration error" on signup
- Missing `SUGARGOO_API_BASE_URL` or `SUGARGOO_API_PASSWORD`
- Check Vercel env variables
- Or `.env.local` in development

### Products not loading
- (If using Google Sheets)
- Check `GOOGLE_SHEET_ID` and `GOOGLE_API_KEY`
- Verify Google Sheets API enabled in Cloud Console
- Check browser console for errors

### Facebook webhook not working
- Verify webhook URL in Facebook App settings
- Check `FACEBOOK_WEBHOOK_VERIFY_TOKEN`
- Test with `/api/facebook/test` endpoint

### Analytics not showing
- Check `/api/analytics/events` responds
- Verify database connection (if connected)
- Check browser console for fetch errors

## Customization

### Pages & Content

- **Home:** `pages/index.tsx`
- **Product listing:** `pages/fashion-listings.tsx`, `pages/tech-listings.tsx`
- **Signup:** `pages/signup.tsx` (main CTA)
- **Tutorial:** `pages/tutorial.tsx`
- **Blog:** Create new files in `pages/blog/` (auto-routed)

### Design & Branding

Edit `styles/globals.css`:
- **Colors:** Search for `rapid-*` variables
- **Fonts:** Headers = Arial Black, Body = Inter
- **Layout:** Tailwind utilities throughout

### Adding Features

Common additions:
- **Email capture:** Edit `pages/signup.tsx` + Omnisend integration
- **A/B tests:** Create new landing pages like `pages/landingpagetest-4.tsx`
- **Custom domain:** Configure in Vercel settings
- **Analytics dashboard:** Connect to Supabase + build admin UI

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React + TypeScript | Type-safe, fast development |
| **Framework** | Next.js 14 | SSR, API routes, Vercel native |
| **Styling** | Tailwind CSS | Utility-first, responsive design |
| **Hosting** | Vercel | Serverless, auto-scale, GitHub integration |
| **API** | Sugargoo + Facebook | Direct integrations |
| **Analytics** | Custom events | Lightweight, flexible |

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Sugargoo Support](https://sugargoo.com/support)
- [Facebook Lead Ads](https://www.facebook.com/business/help/160332861836236)

## Support

- **Issues:** Check `TROUBLESHOOTING.md`
- **Setup:** See `SETUP.md`
- **Deployment:** See `DEPLOYMENT.md`

---

**Status:** ✅ Production Ready  
**Last Updated:** September 2026  
**Version:** 2.0 (Sugargoo Auto-Registration)

Made with ❤️ for high-converting funnels
