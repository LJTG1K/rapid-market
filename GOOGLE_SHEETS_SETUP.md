# Google Sheets Integration Setup

Your RAPID funnel is now connected to pull products directly from your Google Sheet!

## What's Been Implemented

✅ **Automatic Product Fetching** - Products pull directly from your Google Sheet
✅ **Smart Categorization** - Products auto-categorized based on keywords in name/description
✅ **Real-Time Updates** - Edit your sheet, products update automatically
✅ **Image Support** - Product images from sheet URLs
✅ **Price & Link Integration** - Prices and Sugargoo links from sheet

---

## Categories Supported

Your products are automatically sorted into these categories:

- **T-Shirts** - Keywords: t-shirt, tshirt, graphic tee, short sleeve
- **Hoodies** - Keywords: hoodie, sweater, sweatshirt
- **Jackets** - Keywords: jacket, denim jacket, zip up
- **Outerwear** - Keywords: outerwear, puffer jacket, winter jacket, fur jacket, ski jacket, windbreaker
- **Pants** - Keywords: pants, jeans, sweatpants, cargo, shorts, trousers
- **Accessories** - Keywords: belt, ring, necklace, bracelet, beanie, hat, earring, watch
- **Bags** - Keywords: bag, backpack, crossbody, tote, suitcase, briefcase
- **All** - Fallback if no category matches

---

## Your Google Sheet

**Sheet ID:** `1QJyne-Hqh91sWs_UMdyibKa1cN9Bt03E7imF-mZ-gbA`

**Expected Columns (A:F):** `pages/api/products.ts` reads column **A as a blank/unused
spacer column** — actual data starts at column B. This matches the live production
sheet's layout, not a 6-column layout starting at A.

| Column | Field |
|--------|-------|
| A | *(unused — leave blank)* |
| B | ITEM NAME |
| C | ITEM IMAGE (full URL) |
| D | DESCRIPTION |
| E | PRICE (e.g., "8.50" or "$8.50") |
| F | LINK (Sugargoo product link) |

**Do NOT modify the sheet structure** — and do not delete column A even though it's
empty, or every column will shift and the feed will break.

---

## Setting Up Environment Variables

### Option A: Via Vercel Dashboard (Recommended)

1. Go to **[vercel.com/dashboard](https://vercel.com/dashboard)**
2. Click your **rapid** project
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:

| Key | Value | Notes |
|-----|-------|-------|
| `GOOGLE_SHEET_ID` | `1QJyne-Hqh91sWs_UMdyibKa1cN9Bt03E7imF-mZ-gbA` | Your sheet ID |
| `GOOGLE_API_KEY` | *(Your API key)* | Get from Google Cloud Console |

5. Click "Save" → Vercel auto-redeploys

### Option B: Get Your Google API Key

If you don't have a Google API Key yet:

1. Go to **[console.cloud.google.com](https://console.cloud.google.com)**
2. Create a new project (or select existing)
3. Search for **"Google Sheets API"** → Click **Enable**
4. Click **"Create Credentials"**
   - Application type: **Web application**
   - Click **"Create OAuth client ID"** or **"Create API Key"**
   - Choose **"API Key"**
5. **Copy the API Key**
6. *(Optional)* Restrict the key to Google Sheets API only for security

---

## Testing It Works

### Local Testing

1. Copy your API key to `.env.local`:
   ```
   GOOGLE_SHEET_ID=1QJyne-Hqh91sWs_UMdyibKa1cN9Bt03E7imF-mZ-gbA
   GOOGLE_API_KEY=your_api_key_here
   ```

2. Run locally:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:3000/listings`
4. Check that products load from your sheet

### Production Testing

1. Add env vars to Vercel (see above)
2. Wait for auto-redeploy
3. Visit your production URL
4. Check `/listings` page for products

---

## Troubleshooting

### "Products not loading"
- Check that `GOOGLE_SHEET_ID` is set in Vercel env vars
- Check that `GOOGLE_API_KEY` is set and valid
- Make sure Google Sheets API is enabled in Cloud Console
- Test the sheet is publicly readable (or share it with your API key's service account)

### "Wrong categories"
- Check product names/descriptions match category keywords
- Add new keywords to `pages/api/products.ts` if needed
- Example: If you sell "Crewneck Sweaters" → Add "crewneck" to Hoodies keywords

### "Images not showing"
- Make sure image URLs in sheet are valid and publicly accessible
- Test URLs directly in browser first
- Use direct links (imgur, Google Drive shared links, CDN, etc.)

### "Prices wrong format"
- Prices should be: `8.50` or `$8.50` (the API strips the $)
- Use numbers only in your sheet

---

## Making Changes

### Update Products
1. Edit your Google Sheet
2. Add/remove/edit products
3. Wait ~5 minutes (cache refresh time)
4. Refresh your site

### Update Prices/Images/Links
1. Edit the cell in your Google Sheet
2. Wait for cache to refresh
3. Done!

### Add New Category Keywords
If you have products that aren't categorizing correctly:

1. Edit `pages/api/products.ts`
2. Find the `categoryMap` object
3. Add your keywords:
   ```typescript
   'your-keyword': 'Category Name',
   ```
4. Push to GitHub:
   ```bash
   git add pages/api/products.ts
   git commit -m "Add new category keywords"
   git push origin main
   ```
5. Vercel auto-redeploys

---

## API Quota Notes

**Google Sheets API free tier:**
- 500 requests per 100 seconds
- Your site caches products for 1 hour (production) / 5 minutes (development)
- This means ~14-30 product page views per cache period

For higher traffic, upgrade to a paid plan or implement database caching.

---

## Example Sheet Setup

| *(A, blank)* | ITEM NAME | ITEM IMAGE | DESCRIPTION | PRICE | LINK |
|---|-----------|-----------|-------------|-------|------|
| | White Classic T-Shirt | https://example.com/tee.jpg | Premium white cotton tee | 8.50 | https://sugargoo.com/item/123 |
| | Black Hoodie | https://example.com/hoodie.jpg | Cozy black hoodie | 18.99 | https://sugargoo.com/item/456 |

---

## Questions?

- See `README.md` for full docs
- Check `PROJECT_SUMMARY.md` for architecture overview
- Email: (once you have it!)

---

**Status:** ✅ Ready for production

Once you've added the env vars to Vercel, your products will be live!
