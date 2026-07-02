# 🚀 START HERE - RAPID Deployment Guide

Your RAPID funnel is **built and ready**. Follow this checklist to get it live in ~15 minutes.

---

## Quick Start (5 minutes)

### Step 1: Create GitHub Repo
1. Go to [github.com/new](https://github.com/new)
2. Name: `rapid`
3. Public (important!)
4. Create → Copy the URL

### Step 2: Push to GitHub
```bash
cd /data/.openclaw/workspace/rapid
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rapid.git
git push -u origin main
```
Replace `YOUR_USERNAME` with your GitHub username.

### Step 3: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select the `rapid` repo
5. Click through defaults
6. **ADD ENVIRONMENT VARIABLES:**
   - `SUGARGOO_SIGNUP_URL`: Your Sugargoo invitation link
   - Other vars optional (see below)
7. Click "Deploy"

**Done!** Your site is live in ~2 minutes.

---

## Environment Variables

### Required
- **`SUGARGOO_SIGNUP_URL`** = Your Sugargoo invitation link
  - Format: `https://www.sugargoo.com/auth/register?invite_code=YOUR_CODE`
  - Get this from your Sugargoo account
  - Update monthly when it expires

### Optional (for real products)
- **`GOOGLE_SHEET_ID`** = Your Google Sheet ID
- **`GOOGLE_API_KEY`** = Your Google Sheets API key

*Not adding these? Site runs fine with demo products.*

---

## After Deployment

### Test It
- Visit your Vercel URL
- Click through all pages
- Test the Sugargoo signup link

### Share It
- Custom domain (in Vercel settings)
- Social media
- Ads
- Discord

### Monitor It
- Vercel "Analytics" tab = page views
- `logs/analytics.jsonl` (local) = click tracking
- Later: Add Supabase/database for better analytics

---

## Monthly Update (When Sugargoo Link Expires)

1. Get new invitation link from Sugargoo
2. Go to Vercel project settings
3. Update `SUGARGOO_SIGNUP_URL` env var
4. Save (Vercel auto-redeploys)
5. Done! ✅

---

## Need Help?

| Question | File to Read |
|----------|------------|
| What's in this project? | `PROJECT_SUMMARY.md` |
| How do I set up Google Sheets? | `SETUP.md` → Section 2 |
| Deployment troubleshooting? | `DEPLOYMENT.md` |
| Full documentation? | `README.md` |

---

## Technical Details (For Future Reference)

**Stack:**
- React + Next.js 14
- Tailwind CSS
- TypeScript
- Vercel hosting

**Pages:**
- Home: Hero + categories
- Listings: Browse products, search, filter
- Sign Up: Redirect to Sugargoo
- Tutorial: How-to guide

**Features:**
- Analytics tracking (clicks, signups)
- Google Sheets integration (optional)
- Mobile responsive
- Fast performance

---

## Checklist

- [ ] GitHub repo created and pushed
- [ ] Vercel account connected
- [ ] `SUGARGOO_SIGNUP_URL` added to Vercel env
- [ ] Site deployed (Vercel shows "Ready")
- [ ] Site tested locally/in browser
- [ ] Analytics logging works
- [ ] Sugargoo link redirects correctly
- [ ] Custom domain configured (optional)

---

## Common Issues

**"Build failed"**
→ Check Vercel build logs, usually missing env variable

**"Products not showing"**
→ If using Google Sheets, did you set the env vars and update the code?

**"Signup link doesn't work"**
→ Make sure link includes `invite_code` parameter

**"Slow page load"**
→ Refresh (might be building), or check Vercel status page

---

## What's Next?

1. **Get it live** (above checklist)
2. **Test the flow** (signup, click products)
3. **Share link** (Twitter, Discord, ads, etc.)
4. **Monitor analytics** (see which products click)
5. **Optimize** (improve copy/design based on data)
6. **Scale** (add more products, better targeting)

---

## Resources

- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs
- Sugargoo: https://sugargoo.com
- This project: `README.md`

---

## Summary

```
Built ✅          → RAPID funnel is complete
Committed ✅       → Files are in Git
Ready to deploy → Push to GitHub
                → Connect Vercel
                → Add env variables
                → Click "Deploy"
                → Live in 2 minutes!
```

**Let's go! 🚀**

Questions? Check the docs or reach out.

---

**Status: Ready for production**
**Time to live: ~15 minutes**
**Maintenance: ~5 minutes/month**
