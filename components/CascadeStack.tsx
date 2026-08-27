import { useState } from 'react';
import Image from 'next/image';
import Reveal from './Reveal';

interface CascadeImage {
  src: string;
  alt: string;
}

// Diagonal staircase, largest at top-left down to smallest at bottom-right —
// each frame uses the page background as a 4px "mat" so overlaps read as
// physically stacked prints rather than clipped bitmaps.
// The stack only renders at lg+, inside a ~498px column, so each frame's real
// display width is small — the sizes hints keep next/image from serving far
// more pixels than the frame can show.
const SLOTS = [
  { pos: 'top-0 left-[8%] w-[58%]', z: 'z-10', sizes: '(min-width: 1400px) 290px, 25vw' },
  { pos: 'top-[12%] right-0 w-[48%]', z: 'z-20', sizes: '(min-width: 1400px) 240px, 21vw' },
  { pos: 'top-[44%] left-0 w-[52%]', z: 'z-30', sizes: '(min-width: 1400px) 260px, 22vw' },
  { pos: 'bottom-0 right-[8%] w-[30%]', z: 'z-40', sizes: '(min-width: 1400px) 150px, 13vw' },
];

function CascadeFrame({ img, slot, delay }: { img: CascadeImage; slot: typeof SLOTS[number]; delay: number }) {
  const [errored, setErrored] = useState(false);

  return (
    <Reveal
      delay={delay}
      className={`absolute ${slot.pos} ${slot.z} aspect-square border-4 border-stone shadow-stamp overflow-hidden bg-paper transition-transform duration-300 hover:-translate-y-1 hover:z-50`}
    >
      {img.src && !errored ? (
        // Lazy (the next/image default) is load-bearing here, not just polite:
        // the whole stack sits in a `hidden lg:block` column, and a lazy image
        // with no layout box never intersects, so mobile never fetches these.
        <Image
          src={img.src}
          alt={img.alt}
          fill
          sizes={slot.sizes}
          className="object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="w-full h-full placeholder-media flex items-center justify-center font-mono text-[10px] uppercase tracking-wide text-muted text-center px-3">
          [ {img.alt} ]
        </div>
      )}
    </Reveal>
  );
}

export default function CascadeStack({ images }: { images: CascadeImage[] }) {
  return (
    <div className="relative h-[520px] xl:h-[600px]">
      {images.slice(0, 4).map((img, i) => (
        <CascadeFrame key={i} img={img} slot={SLOTS[i]} delay={i * 140} />
      ))}
    </div>
  );
}
