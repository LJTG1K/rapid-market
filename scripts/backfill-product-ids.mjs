#!/usr/bin/env node
/**
 * One-time, READ-ONLY helper for the "give every product a permanent ID"
 * migration. It does not write to the sheet — it prints a column of values
 * for you to paste into column A (currently unused/empty) of each sheet
 * tab yourself, via the normal Sheets UI.
 *
 * It replicates pages/api/products.ts's exact current validation/skip logic
 * row-for-row, so every ID it prints for a currently-valid row is IDENTICAL
 * to the ID that row has on the live site right now — no existing
 * /product/{id} link, wishlist entry, or ad-pixel event breaks.
 *
 * products.ts already prefers column A's value when one is present and
 * only falls back to its old counter for rows that don't have one — so
 * there's no cutover risk here. You can paste this in whenever you like,
 * for one sheet or both, all at once or a few rows at a time; nothing
 * breaks in between.
 *
 * Usage:
 *   1. Make sure GOOGLE_SHEET_ID and GOOGLE_API_KEY are set — the same two
 *      vars pages/api/products.ts already uses (whatever real values your
 *      deployment uses; .env.local locally doesn't have them, see below).
 *   2. node --env-file=.env.local scripts/backfill-product-ids.mjs
 *      (or export the two vars in your shell first, then plain `node
 *      scripts/backfill-product-ids.mjs` — either works, Node just needs
 *      them in process.env by the time this runs)
 *   3. For each sheet it prints, select column A starting at row 1 in that
 *      Google Sheet tab, and paste the corresponding block of values in.
 */

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const API_KEY = process.env.GOOGLE_API_KEY;

if (!SHEET_ID || !API_KEY) {
  console.error('Missing GOOGLE_SHEET_ID or GOOGLE_API_KEY in the environment.');
  console.error('Set them (e.g. in .env.local) with the same values pages/api/products.ts uses, then re-run.');
  process.exit(1);
}

const CATEGORIES = [
  { category: 'fashion', guessedSheetName: 'Fashion' },
  { category: 'tech', guessedSheetName: 'Tech' },
];

async function fetchSheetValues(sheetName) {
  const range = encodeURIComponent(`${sheetName}!A:H`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.values || [];
}

async function resolveSheetName(target) {
  const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}&fields=sheets`;
  const res = await fetch(metadataUrl);
  if (!res.ok) return null;
  const data = await res.json();
  const sheets = data.sheets || [];
  const found = sheets.find((s) => s.properties?.title?.toUpperCase() === target.toUpperCase());
  return found ? found.properties.title : null;
}

// Mirrors pages/api/products.ts's skip logic exactly — same order, same
// conditions — so the id assigned to each surviving row matches production.
function isValidRow(row) {
  if (!row || row.length < 6) return false;

  const name = (row[1] || '').toString().trim();
  const price = (row[4] || '').toString().trim();
  const link = (row[5] || '').toString().trim();

  if (!name || name.toLowerCase().includes('item name') || name.toLowerCase().includes('use ctrl')) return false;
  if (!price || price.toLowerCase() === 'price') return false;
  if (!link || link.toUpperCase() === 'LINK') return false;
  if (!link.startsWith('http')) return false;

  const priceStr = price.replace(/[$,]/g, '').trim();
  if (!priceStr || isNaN(parseFloat(priceStr))) return false;

  return true;
}

async function run() {
  for (const { category, guessedSheetName } of CATEGORIES) {
    let sheetName = guessedSheetName;
    let rows = await fetchSheetValues(sheetName);

    if (rows === null) {
      const resolved = await resolveSheetName(category === 'tech' ? 'TECH' : 'FASHION');
      if (!resolved) {
        console.error(`\n[${category}] Could not find a matching sheet tab — skipping.`);
        continue;
      }
      sheetName = resolved;
      rows = await fetchSheetValues(sheetName);
    }

    if (!rows) {
      console.error(`\n[${category}] Failed to fetch values for sheet "${sheetName}".`);
      continue;
    }

    console.log(`\n===== ${sheetName} (${category}) — paste into column A, starting at row 1 =====`);
    console.log(`(${rows.length} rows total)\n`);

    let nextId = 1;
    const columnA = [];
    // Row 0 is the header row — labels column A "ID" instead of assigning one.
    columnA.push('ID');
    for (let i = 1; i < rows.length; i++) {
      if (isValidRow(rows[i])) {
        columnA.push(String(nextId));
        nextId++;
      } else {
        columnA.push(''); // Not a live product today — leave column A blank for this row.
      }
    }

    console.log(columnA.join('\n'));
    console.log(`\n===== End of ${sheetName} — ${nextId - 1} live products got an ID =====\n`);
  }
}

run();
