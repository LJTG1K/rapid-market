import type { NextApiRequest, NextApiResponse } from 'next';
import { normalizeStyleTagsInput, normalizeFitInput, type StyleKey, type FitKey } from '../../lib/styleMatch';

interface Product {
  id: string;
  name: string;
  image: string;
  description: string;
  price: string;
  sugargooLink: string;
  category: string;
  verified?: boolean;
  // From the Sheet's manual STYLE TAGS / FIT columns (H/I) — optional because
  // most rows aren't tagged yet. See lib/styleMatch.ts for how these override
  // the brand/keyword heuristic once present.
  manualStyleTags?: StyleKey[];
  manualFit?: FitKey | null;
  excludeFromQuiz?: boolean;
}

const fashionCategoryMap: { [key: string]: string } = {
  't-shirt': 'T-Shirts',
  'tshirt': 'T-Shirts',
  'graphic tee': 'T-Shirts',
  'short sleeve': 'T-Shirts',
  'hoodie': 'Hoodies',
  'sweater': 'Hoodies',
  'sweatshirt': 'Hoodies',
  'jacket': 'Jackets',
  'coat': 'Jackets',
  'puffer': 'Jackets',
  'denim jacket': 'Jackets',
  'zip up': 'Jackets',
  'outerwear': 'Outerwear',
  'puffer jacket': 'Outerwear',
  'winter jacket': 'Outerwear',
  'fur jacket': 'Outerwear',
  'ski jacket': 'Outerwear',
  'windbreaker': 'Outerwear',
  'pants': 'Pants',
  'jeans': 'Pants',
  'sweatpants': 'Pants',
  'cargo': 'Pants',
  'shorts': 'Pants',
  'trousers': 'Pants',
  'belt': 'Accessories',
  'ring': 'Accessories',
  'necklace': 'Accessories',
  'bracelet': 'Accessories',
  'beanie': 'Accessories',
  'hat': 'Accessories',
  'earring': 'Accessories',
  'watch': 'Accessories',
  'bag': 'Bags',
  'backpack': 'Bags',
  'crossbody': 'Bags',
  'tote': 'Bags',
  'suitcase': 'Bags',
  'briefcase': 'Bags',
};

const techCategoryMap: { [key: string]: string } = {
  'mouse pad': 'Gaming',
  'mousepad': 'Gaming',
  'mouse': 'Gaming',
  'keyboard': 'Gaming',
  'keycap': 'Gaming',
  'switch': 'Gaming',
  'mechanical': 'Gaming',
  'gaming': 'Gaming',
  'phone case': 'Phone Accessories',
  'iphone case': 'Phone Accessories',
  'phone': 'Phone Accessories',
  'camera protect': 'Phone Accessories',
  'charger': 'Phone Accessories',
  'lamp': 'Lighting',
  'light': 'Lighting',
  'led': 'Lighting',
  'mirror': 'Lighting',
  'speaker': 'Audio',
  'headset': 'Audio',
  'headphone': 'Audio',
  'earphone': 'Audio',
  'earbud': 'Audio',
  'monitor': 'Desk Setup',
  'stand': 'Desk Setup',
  'wrap': 'Skins & Wraps',
  'carbon': 'Skins & Wraps',
  'camo': 'Skins & Wraps',
  'keychain': 'Decor & Keychains',
  'ornament': 'Decor & Keychains',
};

function categorizeFashionProduct(name: string, description: string): string {
  const fullText = `${name} ${description}`.toLowerCase();
  for (const [keyword, category] of Object.entries(fashionCategoryMap)) {
    if (fullText.includes(keyword)) {
      return category;
    }
  }
  return 'Other';
}

function categorizeTechProduct(name: string, description: string): string {
  const fullText = `${name} ${description}`.toLowerCase();
  for (const [keyword, category] of Object.entries(techCategoryMap)) {
    if (fullText.includes(keyword)) {
      return category;
    }
  }
  return 'Other';
}

// Category-aware fallback copy for products whose Sheet row has no description,
// so an undescribed hoodie doesn't read the same as an undescribed keyboard.
// Kept short and in RAPID's editorial voice.
const fallbackCopyByCategory: { [category: string]: string } = {
  // Fashion
  'T-Shirts': 'Everyday tee from a verified seller — check the listing photos for fit and print detail.',
  Hoodies: 'Cozy fleece-weight piece from a verified seller — see the seller photos for fit and colour.',
  Jackets: 'Layer-ready jacket from a verified seller — review the listing shots for cut and materials.',
  Outerwear: 'Weather-ready outerwear from a verified seller — check the photos for insulation and fit.',
  Pants: 'Versatile bottoms from a verified seller — see the listing for sizing and fabric detail.',
  Bags: 'Carry piece from a verified seller — check the photos for size, hardware and finish.',
  Accessories: 'Finishing-touch accessory from a verified seller — see the listing photos for detail.',
  // Tech
  Gaming: 'Gaming gear from a verified seller — check the listing for specs and compatibility.',
  'Phone Accessories': 'Phone accessory from a verified seller — confirm your model in the listing photos.',
  Lighting: 'Ambient lighting piece from a verified seller — see the listing for size and setup.',
  Audio: 'Audio gear from a verified seller — check the listing for specs and connectivity.',
  'Desk Setup': 'Desk-setup piece from a verified seller — review the photos for dimensions and finish.',
  'Skins & Wraps': 'Skin / wrap from a verified seller — confirm your device and finish in the listing.',
  'Decor & Keychains': 'Collectible decor piece from a verified seller — see the photos for size and detail.',
};

function fallbackDescription(category: string): string {
  return (
    fallbackCopyByCategory[category] ||
    'Sourced from a verified seller — check the listing photos and details before ordering.'
  );
}

// In-memory, per-warm-instance cache. At least 14 different pages
// (fashion-listings, tech-listings, every product page, the homepage, brand
// pages, the style quiz, …) independently call this endpoint, and each
// uncached hit was costing two sequential round trips to the Google Sheets
// API — the actual source of the multi-second page loads, not anything on
// the client. This turns "every page load re-fetches the sheet" into "at
// most one Sheets fetch per category every 5 minutes," which is what the
// existing Cache-Control header was already assuming would happen upstream.
const CACHE_TTL_MS = 5 * 60 * 1000;
const productCache = new Map<string, { data: Product[]; expiresAt: number }>();

async function fetchSheetValues(sheetId: string, apiKey: string, sheetName: string) {
  const range = encodeURIComponent(`${sheetName}!A:H`);
  const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
  return fetch(dataUrl);
}

// Only hit the metadata endpoint (a second round trip) if the tab isn't
// named exactly what we guessed — handles a renamed/re-cased tab without
// paying for sheet discovery on every request.
async function resolveSheetName(sheetId: string, apiKey: string, category: string): Promise<string | null> {
  const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}&fields=sheets`;
  const sheetsResponse = await fetch(metadataUrl);
  if (!sheetsResponse.ok) {
    console.error('Failed to fetch sheet metadata:', sheetsResponse.statusText);
    return null;
  }
  const sheetsData = await sheetsResponse.json();
  const sheets = sheetsData.sheets || [];
  const target = category.toLowerCase() === 'tech' ? 'TECH' : 'FASHION';
  const found = sheets.find((s: any) => s.properties?.title?.toUpperCase() === target);
  return found ? (found as any).properties.title : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Product[]>
) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const apiKey = process.env.GOOGLE_API_KEY;
    const category = (req.query.category as string) || 'fashion';
    const cacheKey = category.toLowerCase();
    const cacheTime = process.env.NODE_ENV === 'production' ? 3600 : 300;

    if (!sheetId || !apiKey) {
      console.warn('Google Sheets credentials not configured. Using demo data.');
      return res.status(200).json(getDemoProducts());
    }

    const cached = productCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader('Cache-Control', `public, s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime * 2}`);
      return res.status(200).json(cached.data);
    }

    console.log(`📥 Fetching ${category} products from Google Sheets...`);

    const categoryFunc = category.toLowerCase() === 'tech' ? categorizeTechProduct : categorizeFashionProduct;
    const guessedSheetName = category.toLowerCase() === 'tech' ? 'Tech' : 'Fashion';

    let sheetName = guessedSheetName;
    let dataResponse = await fetchSheetValues(sheetId, apiKey, sheetName);

    if (!dataResponse.ok) {
      const resolved = await resolveSheetName(sheetId, apiKey, category);
      if (!resolved) {
        console.error('No matching sheet found for category:', category);
        return res.status(200).json(getDemoProducts());
      }
      sheetName = resolved;
      dataResponse = await fetchSheetValues(sheetId, apiKey, sheetName);
      if (!dataResponse.ok) {
        console.error(`API error: ${dataResponse.status} ${dataResponse.statusText}`);
        return res.status(200).json(getDemoProducts());
      }
    }

    const data = await dataResponse.json();
    const rows = data.values || [];

    console.log(`📈 Got ${rows.length} rows from ${sheetName}`);

    if (rows.length <= 1) {
      console.warn('No data rows found');
      return res.status(200).json(getDemoProducts());
    }

    const products: Product[] = [];
    let productId = 1;
    let skipped = 0;
    let skipReasons = { noName: 0, noPrice: 0, noLink: 0, badLink: 0, badPrice: 0 };

    // IMPORTANT: Column structure is (Empty) | NAME | IMAGE | DESCRIPTION | PRICE | LINK
    // So indices are: row[0]=empty, row[1]=name, row[2]=image, row[3]=description, row[4]=price, row[5]=link
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 6) continue;

      const name = (row[1] || '').toString().trim();
      const image = (row[2] || '').toString().trim();
      const description = (row[3] || '').toString().trim();
      const price = (row[4] || '').toString().trim();
      const link = (row[5] || '').toString().trim();

      // Skip headers and empty rows
      if (!name || name.toLowerCase().includes('item name') || name.toLowerCase().includes('use ctrl')) {
        skipReasons.noName++;
        skipped++;
        continue;
      }

      if (!price || price.toLowerCase() === 'price') {
        skipReasons.noPrice++;
        skipped++;
        continue;
      }

      if (!link || link === '' || link.toUpperCase() === 'LINK') {
        skipReasons.noLink++;
        skipped++;
        continue;
      }

      // Ensure link is a valid URL
      if (!link.startsWith('http')) {
        skipReasons.badLink++;
        skipped++;
        continue;
      }

      const priceStr = price.replace(/[$,]/g, '').trim();
      if (!priceStr || isNaN(parseFloat(priceStr))) {
        skipReasons.badPrice++;
        skipped++;
        continue;
      }

      const productCategory = categoryFunc(name, description || '');

      const styleTagsRaw = (row[6] || '').toString().trim();
      const fitRaw = (row[7] || '').toString().trim();
      const styleTagsParsed = normalizeStyleTagsInput(styleTagsRaw);
      const fitParsed = normalizeFitInput(fitRaw);

      const product: Product = {
        id: productId.toString(),
        name: name.trim(),
        // Empty rather than a third-party placeholder URL: ProductImage renders
        // the local hatch placeholder for a falsy src, so a missing sheet image
        // costs no request to an outside service.
        image: image.startsWith('http') ? image : '',
        description: description && description !== 'DESCRIPTION' && description !== ''
          ? description.trim()
          : fallbackDescription(productCategory),
        price: `$${priceStr}`,
        sugargooLink: link.trim(),
        category: productCategory,
        verified: true,
        manualStyleTags: styleTagsParsed.tags,
        manualFit: fitParsed.fit,
        excludeFromQuiz: styleTagsParsed.exclude || fitParsed.exclude,
      };

      products.push(product);
      productId++;
    }

    console.log(`✅ Successfully loaded ${products.length} products`);
    if (category.toLowerCase() === 'tech' || (category === 'fashion' && skipped > 0)) {
      console.log(`⏭️  Skipped ${skipped} rows: noName=${skipReasons.noName}, noPrice=${skipReasons.noPrice}, noLink=${skipReasons.noLink}, badLink=${skipReasons.badLink}, badPrice=${skipReasons.badPrice}`);
    }

    // Don't cache an empty/demo result as if it were real data — a transient
    // parse hiccup should self-heal on the next request, not lock the whole
    // site into showing the one-item fallback for the full TTL.
    if (products.length > 0) {
      productCache.set(cacheKey, { data: products, expiresAt: Date.now() + CACHE_TTL_MS });
    }

    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime * 2}`
    );

    res.status(200).json(products.length > 0 ? products : getDemoProducts());
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(200).json(getDemoProducts());
  }
}

function getDemoProducts(): Product[] {
  return [
    {
      id: '1',
      name: 'Premium White Cotton Tee',
      image: 'https://img.alicdn.com/bao/uploaded/i4/2209623062/O1CN01UPiXNk1NvDGWyFvl0_!!2209623062.jpg_430x430q90.jpg',
      description: 'Classic white cotton t-shirt',
      price: '$15',
      sugargooLink: 'https://www.sugargoo.com',
      category: 'T-Shirts',
      verified: true,
    },
  ];
}
