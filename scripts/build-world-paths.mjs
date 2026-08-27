#!/usr/bin/env node
/**
 * Builds public/data/shipping/world-paths.json — one pre-rendered SVG path
 * per country, keyed by ISO 3166-1 alpha-2, generated once from Natural
 * Earth 110m geometry (public domain, via the world-atlas package).
 *
 * This runs at dev/build time only. mapshaper/d3-geo/topojson-client/
 * world-atlas/i18n-iso-countries are devDependencies and never ship to the
 * client — components/tools/WorldMap.tsx fetches the *output* JSON file,
 * not any of these packages. Re-run after upgrading world-atlas or if the
 * projection/viewBox needs to change; the output is committed so the app
 * never depends on this script at request time.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import { feature } from 'topojson-client';
import countries from 'i18n-iso-countries';
import world from 'world-atlas/countries-110m.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '..', 'public', 'data', 'shipping', 'world-paths.json');

const WIDTH = 960;
const HEIGHT = 500;

// Natural Earth's numeric id for Antarctica ("010" -> AQ) and a few polar/
// tiny entries add noise to a shipping map's bounding box and aren't
// Sugargoo destinations. Excluded by numeric id, not by geometry size, so
// the exclusion list stays legible.
const EXCLUDE_NUMERIC = new Set(['010']); // Antarctica

function main() {
  const geojson = feature(world, world.objects.countries);

  const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], geojson);
  const pathGen = geoPath(projection);

  const paths = {};
  const skipped = [];

  for (const f of geojson.features) {
    const numeric = String(f.id).padStart(3, '0');
    if (EXCLUDE_NUMERIC.has(numeric)) continue;

    const alpha2 = countries.numericToAlpha2(numeric);
    if (!alpha2) {
      skipped.push({ numeric, name: f.properties?.name });
      continue;
    }

    const d = pathGen(f);
    if (!d) {
      skipped.push({ numeric, name: f.properties?.name, reason: 'empty path' });
      continue;
    }

    if (paths[alpha2]) {
      // Two Natural Earth features mapping to the same alpha-2 would silently
      // overwrite each other — fail loudly instead (see AGENTS.md-style
      // caution around silent data collisions).
      throw new Error(`Duplicate alpha-2 "${alpha2}" from numeric ids — check EXCLUDE_NUMERIC / mapping.`);
    }
    paths[alpha2] = d;
  }

  const output = {
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    projection: 'geoNaturalEarth1',
    source: 'Natural Earth 110m (public domain) via world-atlas',
    paths,
  };

  writeFileSync(OUT_PATH, JSON.stringify(output));
  console.log(`Wrote ${OUT_PATH} with ${Object.keys(paths).length} country paths.`);
  if (skipped.length) {
    console.log(`Skipped ${skipped.length} feature(s) with no alpha-2 mapping (expected — disputed/unrecognised territories):`);
    for (const s of skipped) console.log(`  ${s.numeric}  ${s.name ?? ''} ${s.reason ?? ''}`);
  }
}

main();
