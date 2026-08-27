/**
 * Re-encodes the large source photographs in design-assets/ into web-sized WebP
 * under public/assets/.
 *
 * The originals are 1632x2048 PNGs (5-6 MB each) of photographic content, which
 * is the worst possible format/size combination for the web. Targets below are
 * derived from how each image is actually displayed:
 *
 *   .container-edit = max-w-[1320px] with px-5/8/10  ->  ~1240px content width
 *
 * Run with: npm run optimize:images
 */
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = `${ROOT}/design-assets`;
const OUT = `${ROOT}/public/assets`;

const JOBS = [
  {
    // Full container width (~1240px CSS). Source is already below 2x, so no
    // downscale. Wrapper aspect changes across breakpoints
    // (aspect-[16/10] md:aspect-[21/9]) so don't hard-crop -- the native 2:1
    // sits between the two and object-cover handles the rest.
    src: `${SRC}/hero-main.png`,
    out: `${OUT}/hero-main.webp`,
    resize: { width: 1632, withoutEnlargement: true },
  },
  {
    // Wrapper is always aspect-[3/4], so pre-crop to 3:4 rather than shipping
    // pixels the browser throws away. Displays at ~322px CSS; 900px wide leaves
    // next/image room to emit 640/750px variants.
    src: `${SRC}/hero-detail.png`,
    out: `${OUT}/hero-detail.webp`,
    resize: { width: 900, height: 1200, fit: 'cover' },
  },
  // Every cascade frame is aspect-square at all breakpoints, so a centre square
  // crop matches what CSS renders. Largest frame is ~280px CSS wide.
  ...[1, 2, 3, 4].map((n) => ({
    src: `${SRC}/campaign/cascade-${n}.png`,
    out: `${OUT}/campaign/cascade-${n}.webp`,
    resize: { width: 900, height: 900, fit: 'cover' },
  })),
];

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

let totalIn = 0;
let totalOut = 0;

for (const job of JOBS) {
  await mkdir(dirname(job.out), { recursive: true });

  await sharp(job.src)
    .resize(job.resize)
    .webp({ quality: 80, effort: 6 })
    .toFile(job.out);

  const [before, after] = await Promise.all([stat(job.src), stat(job.out)]);
  totalIn += before.size;
  totalOut += after.size;

  const saved = ((1 - after.size / before.size) * 100).toFixed(1);
  console.log(
    `${job.out.replace(ROOT, '.')}  ${kb(before.size)} -> ${kb(after.size)}  (-${saved}%)`
  );
}

console.log(
  `\nTotal: ${kb(totalIn)} -> ${kb(totalOut)}  (-${((1 - totalOut / totalIn) * 100).toFixed(1)}%)`
);
