# Deployment Guide for RAPID

## Deploy to Vercel (Recommended)

Vercel is the optimal platform for Next.js apps and offers free hosting for side projects.

### Step 1: Prepare for GitHub

If you haven't already, initialize Git and push to GitHub:

```bash
cd rapid
git init
git add .
git commit -m "Initial commit: RAPID funnel platform"
git remote add origin https://github.com/YOUR_USERNAME/rapid.git
git branch -M main
git push -u origin main
```

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### Step 3: Import Project

1. Click "New Project" on Vercel dashboard
2. Find and select the `rapid` repository
3. Leave default settings (Framework: Next.js is auto-detected)
4. Click "Import"

### Step 4: Add Environment Variables

Before deploying, add your environment variables. This list was missing several
required vars — see `.env.example` for the authoritative, up-to-date list.

1. In the import dialog, click "Environment Variables"
2. Add each variable:

| Name | Value | Required for |
|------|-------|---------------|
| `SUGARGOO_API_BASE_URL` | e.g. `https://api.sugargoo.com/opencenter` | Signup — without this, `/signup` returns "Server configuration error" |
| `SUGARGOO_API_USERNAME` | Your Sugargoo API account username | Signup |
| `SUGARGOO_API_PASSWORD` | Your Sugargoo API password | Signup |
| `SUGARGOO_SIGNUP_URL` | Your Sugargoo invitation link | "Go to Sugargoo" fallback link |
| `GOOGLE_SHEET_ID` | Your Google Sheet ID | Product feed — without this, every listing page shows one demo product |
| `GOOGLE_API_KEY` | Your Google Sheets API key | Product feed |
| `FACEBOOK_APP_SECRET` | From your Facebook App | Facebook Lead Ads webhook |
| `FACEBOOK_WEBHOOK_VERIFY_TOKEN` | Any string you choose, matched in the Facebook App webhook config | Facebook Lead Ads webhook |
| `NEXT_PUBLIC_SITE_URL` | Your production URL | Facebook webhook callbacks |
| `NEXT_PUBLIC_META_PIXEL_ID` | Your Meta Pixel ID | Ad conversion tracking |
| `META_CONVERSIONS_API_TOKEN` | Your Meta Conversions API token | Server-side conversion events |
| `ADMIN_PASSWORD` | A password you choose | `/admin` dashboard (server-only — do not prefix with `NEXT_PUBLIC_`) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Optional | Signup notifications |

3. Click "Deploy"

### Step 5: Wait for Deployment

Vercel will:
- Clone your repository
- Install dependencies
- Build your Next.js app
- Deploy to CDN

This takes ~2-3 minutes. You'll see a progress indicator.

### Step 6: Access Your Site

Once deployed:
- Your site is live at: `https://rapid-[random].vercel.app`
- (Or a custom domain if you add one)
- Click "Visit" to see your live site

---

## Monthly Updates (Sugargoo Link)

Every month, update your Sugargoo invitation link:

### Option A: Via Vercel Dashboard (Easy)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your `rapid` project
3. Go to "Settings" → "Environment Variables"
4. Find `SUGARGOO_SIGNUP_URL`
5. Click edit, paste new invitation link
6. Click "Save"
7. Vercel will auto-redeploy ✅

### Option B: Via Git Push (Recommended if you change code)

1. Update your `.env.local` locally
2. Commit and push:
   ```bash
   git add .env.local
   git commit -m "Monthly: Update Sugargoo signup URL"
   git push origin main
   ```
3. Vercel automatically redeploys on push ✅

---

## Custom Domain

To use your own domain (e.g., `rapid.agency`):

1. Go to Vercel project "Settings"
2. Click "Domains"
3. Enter your domain
4. Update your domain's DNS to point to Vercel:
   - Go to your domain registrar (Namecheap, GoDaddy, etc.)
   - Add CNAME record pointing to Vercel's servers
   - Vercel will show exact DNS instructions

This takes 5-30 minutes to propagate.

---

## Monitoring & Analytics

### View Logs

Click "Deployments" in Vercel to see build logs and any errors.

### Track Performance

Vercel provides built-in analytics:
- Go to "Analytics" tab in Vercel project
- View page views, response times, etc.

### Custom Analytics

To see your tracking data (product clicks, signup clicks):

**In development:** Check `logs/analytics.jsonl`

**In production:** 
- Store logs in a database (Supabase, MongoDB, etc.)
- Or use a service like PostHog, Mixpanel
- Update `pages/api/track.ts` to send data there

---

## Troubleshooting Deployment

### Build fails
- Check Vercel build logs for errors
- Common issues:
  - Missing environment variables
  - TypeScript errors (run `npm run lint`)
  - Missing dependencies (check `package.json`)

### Site is blank
- Check browser console (F12) for errors
- Verify API routes work: `/api/products`, `/api/track`
- Check that Next.js compiled successfully in Vercel logs

### Products aren't loading
- Verify `GOOGLE_API_KEY` in Vercel env vars
- Test Google Sheets API directly
- Check API quota in Google Cloud Console

### Signup link doesn't work
- Make sure `SUGARGOO_SIGNUP_URL` includes full URL
- Test link directly in browser
- Ensure it has valid `invite_code` parameter

---

## Rollback a Deployment

If something breaks:

1. Go to Vercel "Deployments"
2. Find the last working deployment
3. Click the "..." menu
4. Click "Promote to Production"

This reverts to a previous version instantly.

---

## Alternative Hosting

If you prefer not to use Vercel:

### Netlify
- Similar to Vercel, supports Next.js
- Go to [netlify.com](https://netlify.com)
- Click "New site from Git"
- Same steps as Vercel

### Self-Hosted (Advanced)
- Build with `npm run build`
- Deploy to AWS, DigitalOcean, Linode, etc.
- Requires more server knowledge

---

## Performance Tips

### Optimize Images
Currently using placeholder images. For production:
- Use Vercel Image Optimization (automatic with Next.js)
- Or upload images to CDN (Cloudinary, imgix, etc.)

### Caching
- Product data caches for 1 hour in production
- CSS/JS caches on Vercel CDN (30 days)
- Adjust cache times in `pages/api/products.ts`

### Analytics
- Current tracking logs locally
- For high traffic, consider external service
- See `pages/api/track.ts` for where to add

---

## Questions?

- Discord: [Join community](https://discord.gg/rapid)
- Email: support@rapid.agency

**Your site is now live and ready to convert!** 🚀
